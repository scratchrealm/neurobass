import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import postNeurobassRequestFromComputeResource from "./postNeurobassRequestFromComputeResource";
import { NBJob } from "./types/neurobass-types";
import { GetFileRequest, GetJobRequest, NeurobassResponse, SetFileRequest, SetJobPropertyRequest } from "./types/NeurobassRequest";

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
        const a = new RunningJob(job)
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
    #status: 'pending' | 'running' | 'completed' | 'failed' = 'pending'
    constructor(public job: NBJob) {
    }
    async initiate(): Promise<boolean> {
        console.info(`Initiating job: ${this.job.jobId} - ${this.job.toolName}`)
        const okay = await this._setJobProperty('status', 'running')
        if (!okay) {
            console.warn('Unable to set job status to running')
            return false
        }
        this.#status = 'running'
        this._run().then(() => { // don't await this!
            //
        }).catch((err) => {
            console.error(err)
            console.error('Problem running job')
        })
        return true
    }
    onCompletedOrFailed(callback: () => void) {
        this.#onCompletedOrFailedCallbacks.push(callback)
    }
    stop() {
        if (this.#childProcess) {
            try {
                this.#childProcess.kill()
            }
            catch (e) {
                console.warn(e)
                console.warn('Unable to kill child process in RunningJob:stop()')
            }
        }
    }
    public get status() {
        return this.#status
    }
    private async _setJobProperty(property: string, value: any): Promise<boolean> {
        const req: SetJobPropertyRequest = {
            type: 'setJobProperty',
            timestamp: Date.now() / 1000,
            workspaceId: this.job.workspaceId,
            projectId: this.job.projectId,
            jobId: this.job.jobId,
            property,
            value,
            computeResourceNodeId: process.env.COMPUTE_RESOURCE_NODE_ID,
            computeResourceNodeName: process.env.COMPUTE_RESOURCE_NODE_NAME || ''
        }
        const resp = await this._postNeurobassRequest(req)
        if (!resp) {
            throw Error(`Unable to set job property: ${property} = ${value}`)
        }
        if (resp.type !== 'setJobProperty') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected setJobProperty')
        }
        return resp.success
    }
    private async _postNeurobassRequest(req: any): Promise<NeurobassResponse> {
        return await postNeurobassRequestFromComputeResource(req, {
            computeResourceId: process.env.COMPUTE_RESOURCE_ID,
            computeResourcePrivateKey: process.env.COMPUTE_RESOURCE_PRIVATE_KEY
        })
    }
    private async _run() {
        if (this.#childProcess) {
            throw Error('Unexpected: Child process already running')
        }

        let consoleOutput = ''
        let lastUpdateConsoleOutputTimestamp = Date.now()
        const updateConsoleOutput = async () => {
            lastUpdateConsoleOutputTimestamp = Date.now()
            const okay = await this._setJobProperty('consoleOutput', consoleOutput)
            if (!okay) {
                // maybe the job no longer exists
                console.warn('Unable to set job console output. Maybe job no longer exists.')
            }
        }
        let lastCheckCanceledTimestamp = Date.now()
        const checkCanceled = async () => {
            lastCheckCanceledTimestamp = Date.now()
            const req: GetJobRequest = {
                type: 'getJob',
                timestamp: Date.now() / 1000,
                workspaceId: this.job.workspaceId,
                projectId: this.job.projectId,
                jobId: this.job.jobId
            }
            try {
                const resp = await this._postNeurobassRequest(req)
                if (resp.type !== 'getJob') {
                    console.warn(resp)
                    throw Error('Unexpected response type. Expected getJob')
                }
            }
            catch(err) {
                console.warn(err)
                console.warn('Unable to get job. Canceling')
                this.stop()
            }
        }
        try {
            const toolName = this.job.toolName
            const jobDir = path.join(process.env.COMPUTE_RESOURCE_DIR, 'jobs', this.job.jobId)
            fs.mkdirSync(jobDir, {recursive: true})

            const jobJsonFilePath = path.join(jobDir, 'job.json')
            const input_files = []
            for (const a of this.job.inputFiles) {
                const req: GetFileRequest = {
                    type: 'getFile',
                    timestamp: Date.now() / 1000,
                    projectId: this.job.projectId,
                    fileName: a.fileName
                }
                const resp = await this._postNeurobassRequest(req)
                if (resp.type !== 'getFile') {
                    console.warn(resp)
                    throw Error('Unexpected response type. Expected getFile')
                }
                const content_string = resp.file.content
                input_files.push({
                    name: a.name,
                    path: a.fileName,
                    content_string
                })
            }
            const output_files = []
            for (const a of this.job.outputFiles) {
                output_files.push({
                    name: a.name,
                    path: a.fileName
                })
            }
            const parameters = []
            for (const a of this.job.inputParameters) {
                parameters.push({
                    name: a.name,
                    value: a.value
                })
            }
            const jobJson = {
                tool_name: toolName,
                input_files,
                output_files,
                parameters
            }
            fs.writeFileSync(jobJsonFilePath, JSON.stringify(jobJson, null, 4))

            const runShContent = `
set -e # exit on error and use return code of last command as return code of script
clean_up () {
    ARG=$?
    chmod -R 777 * # make sure all files are readable by everyone so that they can be deleted even if owned by docker user
    exit $ARG
} 
trap clean_up EXIT

export CONTAINER_METHOD=${process.env.CONTAINER_METHOD}
export OUTPUT_ENDPOINT_URL=${process.env.OUTPUT_ENDPOINT_URL}
export OUTPUT_AWS_ACCESS_KEY_ID=${process.env.OUTPUT_AWS_ACCESS_KEY_ID}
export OUTPUT_AWS_SECRET_ACCESS_KEY=${process.env.OUTPUT_AWS_SECRET_ACCESS_KEY}
export OUTPUT_BUCKET=${process.env.OUTPUT_BUCKET}
export OUTPUT_BUCKET_BASE_URL=${process.env.OUTPUT_BUCKET_BASE_URL}

neurobass run-job
`
            fs.writeFileSync(path.join(jobDir, 'run.sh'), runShContent)

            await new Promise<void>((resolve, reject) => {
                let returned = false

                const cmd = 'bash'
                const args = ['run.sh']

                console.info('WORKING DIR:', jobDir)
                console.info('EXECUTING:', `${cmd} ${args.join(' ')}`)

                const timeoutSec = 60 * 60 * 3 // 3 hours

                this.#childProcess = spawn(cmd, args, {
                    cwd: jobDir
                })

                const timeoutId = setTimeout(() => {
                    if (returned) return
                    console.info(`Killing job: ${this.job.jobId} - ${toolName} due to timeout`)
                    returned = true
                    this.#childProcess.kill()
                    reject(Error('Timeout'))
                }, timeoutSec * 1000)

                this.#childProcess.stdout.on('data', (data: any) => {
                    console.log(`stdout: ${data}`)
                    consoleOutput += data
                    if (Date.now() - lastUpdateConsoleOutputTimestamp > 10000) {
                        updateConsoleOutput()
                    }
                })
                this.#childProcess.stderr.on('data', (data: any) => {
                    console.error(`stderr: ${data}`)
                    consoleOutput += data
                    if (Date.now() - lastUpdateConsoleOutputTimestamp > 10000) {
                        updateConsoleOutput()
                    }
                })
                this.#childProcess.on('error', (error: any) => {
                    if (returned) return
                    returned = true
                    clearTimeout(timeoutId)
                    reject(error)
                })
                this.#childProcess.on('close', (code: any) => {
                    if (returned) return
                    returned = true
                    clearTimeout(timeoutId)
                    if (code !== 0) {
                        reject(Error(`Process exited with code ${code}`))
                    }
                    else {
                        resolve()
                    }
                })

                ; (async () => {
                    while (!returned) {
                        await new Promise<void>((resolve2) => {
                            setTimeout(() => {
                                resolve2()
                            }, 1000)
                        })
                        if (Date.now() - lastCheckCanceledTimestamp > 60000) {
                            checkCanceled()
                        }
                    }
                })()
            })
            
            await updateConsoleOutput()

            const output = await loadOutputJson(jobDir)
            for (const a of this.job.outputFiles) {
                const x = output.outputs[a.name]
                if (!x) {
                    throw Error(`Unexpected: output file not found: ${a.name}`)
                }
                const req: SetFileRequest = {
                    type: 'setFile',
                    timestamp: Date.now() / 1000,
                    projectId: this.job.projectId,
                    workspaceId: this.job.workspaceId,
                    fileName: a.fileName,
                    content: `url:${x.url}`,
                    size: x.size,
                    jobId: this.job.jobId,
                    metadata: {}
                }
                const resp = await this._postNeurobassRequest(req)
                if (resp.type !== 'setFile') {
                    console.warn(resp)
                    throw Error('Unexpected response type. Expected setFile')
                }
            }

            await this._setJobProperty('status', 'completed')
            this.#status = 'completed'

            this.#onCompletedOrFailedCallbacks.forEach(cb => cb())
        }
        catch (err) {
            await updateConsoleOutput()
            await this._setJobProperty('error', err.message)
            await this._setJobProperty('status', 'failed')
            this.#status = 'failed'

            this.#onCompletedOrFailedCallbacks.forEach(cb => cb())
            return
        }
    }
}

type OutputJson = {
    outputs: {[key: string]: {
        url: string
        size: number
    }}
}

const loadOutputJson = async (jobDir: string): Promise<OutputJson> => {
    const output = await fs.promises.readFile(path.join(jobDir, 'output', 'out.json'), {encoding: 'utf8'})
    return JSON.parse(output)
}

// const runCommand = async (cmd: string): Promise<{stdout: string, stderr: string}> => {
//     return new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
//         exec(cmd, (err, stdout, stderr) => {
//             if (err) {
//                 reject(err)
//                 return
//             }
//             resolve({stdout, stderr})
//         })
//     })
// }

export default JobManager