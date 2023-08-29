import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import treeKill from 'tree-kill';
import postNeurobassRequestFromComputeResource from "./postNeurobassRequestFromComputeResource";
import { NBJob } from "./types/neurobass-types";
import { GetJobRequest, NeurobassResponse } from "./types/NeurobassRequest";

const numSimultaneousJobs = parseInt(process.env.NUM_SIMULTANEOUS_JOBS || '1')

class JobManager {
    #runningJobs: RunningJob[] = []
    constructor(private config: {dir: string, onJobCompletedOrFailed: (job: RunningJob) => void}) {

    }
    async initiateJob(job: NBJob): Promise<boolean> {
        // important to check whether job is already running
        if (this.#runningJobs.filter(x => x.job.jobId === job.jobId).length > 0) {
            return false
        }

        if (this.#runningJobs.length >= numSimultaneousJobs) {
            return false
        }
        const a = new RunningJob(this.config.dir, job)
        const okay = await a.initiate()
        if (okay) {
            this._addRunningJob(a)
        }
        return okay
    }
    stop() {
        this.#runningJobs.forEach(j => j.stop())
    }
    async cleanupOldJobs() {
        // list all folders in jobs directory
        const jobsDir = path.join(this.config.dir, 'jobs')
        if (!fs.existsSync(jobsDir)) {
            return
        }
        const folders = await fs.promises.readdir(jobsDir)
        for (const folder of folders) {
            const folderPath = path.join(this.config.dir, 'jobs', folder)
            const stat = await fs.promises.stat(folderPath)
            if (stat.isDirectory()) {
                // check how old the folder is
                const elapsedSec = (Date.now() - stat.mtimeMs) / 1000
                if (elapsedSec > 60 * 60 * 24) {
                    console.info(`Removing old job folder: ${folderPath}`)
                    await fs.promises.rmdir(folderPath, {recursive: true})
                }
            }
        }
    }
    // private async _initiatePythonJob(job: NBJob): Promise<boolean> {
    //     const x = this.#runningJobs.filter(x => x.job.scriptFileName.endsWith('.py'))
    //     const {max_num_concurrent_python_jobs, max_ram_per_python_job_gb} = this.config.computeResourceConfig
    //     if (x.length >= max_num_concurrent_python_jobs) {
    //         return false
    //     }
    //     if ((job.requiredResources?.ramGb || 1) > max_ram_per_python_job_gb) {
    //         return false
    //     }
    //     const a = new RunningJob(job, this.config)
    //     const okay = await a.initiate()
    //     if (okay) {
    //         this._addRunningJob(a)
    //     }
    //     return okay
    // }
    // private async _initiateSpaJob(job: NBJob): Promise<boolean> {
    //     const x = this.#runningJobs.filter(x => x.job.scriptFileName.endsWith('.nba'))
    //     const {max_num_concurrent_spa_jobs, num_cpus_per_spa_job, max_ram_per_spa_job_gb} = this.config.computeResourceConfig
    //     if (x.length >= max_num_concurrent_spa_jobs) {
    //         return false
    //     }
    //     if ((job.requiredResources?.numCpus || 1) > num_cpus_per_spa_job) {
    //         return false
    //     }
    //     if ((job.requiredResources?.ramGb || 1) > max_ram_per_spa_job_gb) {
    //         return false
    //     }
    //     const a = new RunningJob(job, this.config)
    //     const okay = await a.initiate()
    //     if (okay) {
    //         this._addRunningJob(a)
    //     }
    //     return okay
    // }
    private _addRunningJob(job: RunningJob) {
        this.#runningJobs.push(job)
        job.onCompletedOrFailed(() => {
            // remove from list of running jobs
            this.#runningJobs = this.#runningJobs.filter(j => (j.job.jobId !== job.job.jobId))
            this.config.onJobCompletedOrFailed(job)
        })
    }
}

export class RunningJob {
    #onCompletedOrFailedCallbacks: (() => void)[] = []
    #childProcess: ChildProcessWithoutNullStreams | null = null
    #status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' = 'pending'
    #stopped = false
    constructor(private dir: string, public job: NBJob) {
    }
    async initiate(): Promise<boolean> {
        if (this.#childProcess) {
            throw Error('Unexpected: Child process already running')
        }
        console.info(`Initiating job: ${this.job.jobId} - ${this.job.toolName}`)
        
        const cmd = 'neurobass'
        const args = ['handle-job', '--job-id', this.job.jobId]

        this.#childProcess = spawn(cmd, args, {
            cwd: this.dir
        })

        this.#childProcess.on('error', (err) => {
            console.warn(err)
            this._updateStatus()
        })

        this.#childProcess.on('exit', (code) => {
            this._updateStatus()
        })

        this.#childProcess.on('close', (code) => {
            this._updateStatus()
        })

        const timer = Date.now()
        while (Date.now() - timer < 20000) {
            await this._updateStatus()
            if (this.#status !== 'pending') {
                break
            }
        }

        if (this.#status === 'pending') {
            console.warn('Timed out waiting for job to start')
            return false
        }

        this._startUpdatingStatus() // don't await this
    }
    private async _updateStatus() {
        const req: GetJobRequest = {
            type: 'getJob',
            timestamp: Date.now() / 1000,
            jobId: this.job.jobId,
        }
        const resp = await this._postNeurobassRequest(req)
        if (resp.type !== 'getJob') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected getJob')
        }
        const newStatus = resp.job.status
        if (this.#status === newStatus) return
        this.#status = newStatus
        if ((newStatus === 'completed') || (newStatus === 'failed')) {
            this.#onCompletedOrFailedCallbacks.forEach(cb => cb())
        }
    }
    onCompletedOrFailed(callback: () => void) {
        this.#onCompletedOrFailedCallbacks.push(callback)
    }
    stop() {
        if (this.#childProcess) {
            try {
                treeKill(this.#childProcess.pid)
            }
            catch (e) {
                console.warn(e)
                console.warn('Unable to kill child process in RunningJob:stop()')
            }
            this.#stopped = true
        }
    }
    public get status() {
        return this.#status
    }
    private async _postNeurobassRequest(req: any): Promise<NeurobassResponse> {
        return await postNeurobassRequestFromComputeResource(req, {
            computeResourceId: process.env.COMPUTE_RESOURCE_ID,
            computeResourcePrivateKey: process.env.COMPUTE_RESOURCE_PRIVATE_KEY
        })
    }
    async _startUpdatingStatus() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (this.#stopped) break
            await this._updateStatus()
            if (this.#status === 'completed') {
                break
            }
            if (this.#status === 'failed') {
                break
            }
            await new Promise(r => setTimeout(r, 10000))
        }
    }
}

export default JobManager