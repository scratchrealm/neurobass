import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import postNeurobassRequestFromComputeResource from "./postNeurobassRequestFromComputeResource";
import { ComputeResourceConfig } from './ScriptJobExecutor';
import { SPProjectFile, SPScriptJob } from "./types/neurobass-types";
import { GetDataBlobRequest, GetProjectFileRequest, GetProjectFilesRequest, NeurobassResponse, SetProjectFileRequest, SetScriptJobPropertyRequest } from "./types/NeurobassRequest";

type NbaOutput = {
    sorting_nwb_file: string
}

class ScriptJobManager {
    #runningJobs: RunningJob[] = []
    constructor(private config: {dir: string, computeResourceConfig: ComputeResourceConfig, onScriptJobCompletedOrFailed: (job: RunningJob) => void}) {

    }
    async initiateJob(job: SPScriptJob): Promise<boolean> {
        // important to check whether job is already running
        if (this.#runningJobs.filter(x => x.scriptJob.scriptJobId === job.scriptJobId).length > 0) {
            return false
        }
        const {job_slots} = this.config.computeResourceConfig
        const job_slots2 = removeOccupiedJobSlots(job_slots, this.#runningJobs)
        const availableJobSlot = getAvailableJobSlot(job_slots2, job)
        if (!availableJobSlot) {
            return false
        }
        const a = new RunningJob(job, this.config, availableJobSlot)
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
        // list all folders in script_jobs directory
        const scriptJobsDir = path.join(this.config.dir, 'script_jobs')
        if (!fs.existsSync(scriptJobsDir)) {
            return
        }
        const folders = await fs.promises.readdir(scriptJobsDir)
        for (const folder of folders) {
            const folderPath = path.join(this.config.dir, 'script_jobs', folder)
            const stat = await fs.promises.stat(folderPath)
            if (stat.isDirectory()) {
                // check how old the folder is
                const elapsedSec = (Date.now() - stat.mtimeMs) / 1000
                if (elapsedSec > 60 * 60 * 24) {
                    console.info(`Removing old script job folder: ${folderPath}`)
                    await fs.promises.rmdir(folderPath, {recursive: true})
                }
            }
        }
    }
    // private async _initiatePythonJob(job: SPScriptJob): Promise<boolean> {
    //     const x = this.#runningJobs.filter(x => x.scriptJob.scriptFileName.endsWith('.py'))
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
    // private async _initiateSpaJob(job: SPScriptJob): Promise<boolean> {
    //     const x = this.#runningJobs.filter(x => x.scriptJob.scriptFileName.endsWith('.nba'))
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
            this.#runningJobs = this.#runningJobs.filter(j => (j.scriptJob.scriptJobId !== job.scriptJob.scriptJobId))
            this.config.onScriptJobCompletedOrFailed(job)
        })
    }
}

export class RunningJob {
    #onCompletedOrFailedCallbacks: (() => void)[] = []
    #childProcess: ChildProcessWithoutNullStreams | null = null
    #status: 'pending' | 'running' | 'completed' | 'failed' = 'pending'
    constructor(public scriptJob: SPScriptJob, private config: {dir: string, computeResourceConfig: ComputeResourceConfig}, private jobSlot: {num_cpus: number, ram_gb: number, timeout_sec: number}) {
    }
    async initiate(): Promise<boolean> {
        console.info(`Initiating script job: ${this.scriptJob.scriptJobId} - ${this.scriptJob.scriptFileName}`)
        const okay = await this._setScriptJobProperty('status', 'running')
        if (!okay) {
            console.warn('Unable to set script job status to running')
            return false
        }
        this.#status = 'running'
        this._run().then(() => { // don't await this!
            //
        }).catch((err) => {
            console.error(err)
            console.error('Problem running script job')
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
    private async _setScriptJobProperty(property: string, value: any): Promise<boolean> {
        const req: SetScriptJobPropertyRequest = {
            type: 'setScriptJobProperty',
            timestamp: Date.now() / 1000,
            workspaceId: this.scriptJob.workspaceId,
            projectId: this.scriptJob.projectId,
            scriptJobId: this.scriptJob.scriptJobId,
            property,
            value,
            computeResourceNodeId: this.config.computeResourceConfig.node_id,
            computeResourceNodeName: this.config.computeResourceConfig.node_name
        }
        const resp = await this._postNeurobassRequest(req)
        if (!resp) {
            throw Error('Unable to set script job property')
        }
        if (resp.type !== 'setScriptJobProperty') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected setScriptJobProperty')
        }
        return resp.success
    }
    private async _postNeurobassRequest(req: any): Promise<NeurobassResponse> {
        return await postNeurobassRequestFromComputeResource(req, {
            computeResourceId: this.config.computeResourceConfig.compute_resource_id,
            computeResourcePrivateKey: this.config.computeResourceConfig.compute_resource_private_key
        })
    }
    private async _loadFileContent(fileName: string): Promise<string> {
        const req: GetProjectFileRequest = {
            type: 'getProjectFile',
            timestamp: Date.now() / 1000,
            projectId: this.scriptJob.projectId,
            fileName
        }
        const resp = await this._postNeurobassRequest(req)
        if (!resp) {
            throw Error('Unable to get project file')
        }
        if (resp.type !== 'getProjectFile') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected getProjectFile')
        }
        return await this._loadDataBlob(resp.projectFile.contentSha1)
    }
    private async _loadDataBlob(sha1: string): Promise<string> {
        const req: GetDataBlobRequest = {
            type: 'getDataBlob',
            timestamp: Date.now() / 1000,
            workspaceId: this.scriptJob.workspaceId,
            projectId: this.scriptJob.projectId,
            sha1
        }
        const resp = await this._postNeurobassRequest(req)
        if (!resp) {
            throw Error('Unable to get data blob')
        }
        if (resp.type !== 'getDataBlob') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected getDataBlob')
        }
        return resp.content
    }
    async _setProjectFile(fileName: string, fileContent: string) {
        const req: SetProjectFileRequest = {
            type: 'setProjectFile',
            timestamp: Date.now() / 1000,
            workspaceId: this.scriptJob.workspaceId,
            projectId: this.scriptJob.projectId,
            fileName,
            fileContent
        }
        const resp = await this._postNeurobassRequest(req)
        if (!resp) {
            throw Error('Unable to set project file')
        }
        if (resp.type !== 'setProjectFile') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected setProjectFile')
        }
    }
    private async _loadProjectFiles(projectId: string): Promise<SPProjectFile[]> {
        const req: GetProjectFilesRequest = {
            type: 'getProjectFiles',
            timestamp: Date.now() / 1000,
            projectId
        }
        const resp = await this._postNeurobassRequest(req)
        if (!resp) {
            throw Error('Unable to get project')
        }
        if (resp.type !== 'getProjectFiles') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected getProjectFiles')
        }
        return resp.projectFiles
    }
    private async _run() {
        if (this.#childProcess) {
            throw Error('Unexpected: Child process already running')
        }
        const scriptFileName = this.scriptJob.scriptFileName
        const scriptFileContent = await this._loadFileContent(this.scriptJob.scriptFileName)
        const scriptJobDir = path.join(this.config.dir, 'script_jobs', this.scriptJob.scriptJobId)
        fs.mkdirSync(scriptJobDir, {recursive: true})
        fs.writeFileSync(path.join(scriptJobDir, scriptFileName), scriptFileContent)

        const projectFiles = await this._loadProjectFiles(this.scriptJob.projectId)

        if (scriptFileName.endsWith('.py')) {
            for (const pf of projectFiles) {
                let includeFile = false
                if ((scriptFileContent.includes(`'${pf.fileName}'`)) || (scriptFileContent.includes(`"${pf.fileName}"`))) {
                    // the file is referenced in the script
                    includeFile = true
                }
                else if (pf.fileName.endsWith('.py')) {
                    const moduleName = pf.fileName.replace('.py', '')
                    if ((scriptFileContent.includes(`import ${moduleName}`)) || (scriptFileContent.includes(`from ${moduleName}`)) || (scriptFileContent.includes(`import ${moduleName}.`)) || (scriptFileContent.includes(`from ${moduleName}.`))) {
                        // the module is imported in the script
                        includeFile = true
                    }
                }
                if (includeFile) {
                    const content = await this._loadFileContent(pf.fileName)
                    fs.writeFileSync(path.join(scriptJobDir, pf.fileName), content)
                }
            }
        }

        if (scriptFileName.endsWith('.nba')) {
            const nbaFileName = scriptFileName
            const nbaFileContent = scriptFileContent
            const nba = yaml.load(nbaFileContent)
            const nbaType = nba['nba_type']
            let runPyContent: string
            if (nbaType === 'mountainsort5') {
                const recordingNwbFile = nba['recording_nwb_file']
                if (!recordingNwbFile) {
                    throw new Error('Missing recording_nwb_file')
                }
                const x = projectFiles.find(pf => pf.fileName === recordingNwbFile)
                if (!x) {
                    throw new Error(`Unable to find recording_nwb_file: ${recordingNwbFile}`)
                }
                const recordingNwbFileContent = await this._loadFileContent(recordingNwbFile)
                fs.writeFileSync(path.join(scriptJobDir, recordingNwbFile), recordingNwbFileContent)
                const recordingElectricalSeriesPath = nba['recording_electrical_series_path']
                if (!recordingElectricalSeriesPath) {
                    throw new Error('Missing recording_electrical_series_path')
                }
                runPyContent = createMountainsort5RunPyContent(nbaFileName)
            }
            else {
                throw new Error(`Unexpected nba type: ${nbaType}`)
            }
            fs.writeFileSync(path.join(scriptJobDir, 'run.py'), runPyContent)
            const runShContent = `
set -e # exit on error and use return code of last command as return code of script
clean_up () {
    ARG=$?
    chmod -R 777 * # make sure all files are readable by everyone so that they can be deleted even if owned by docker user
    exit $ARG
} 
trap clean_up EXIT
python3 run.py
`
            fs.writeFileSync(path.join(scriptJobDir, 'run.sh'), runShContent)
        }
        else if (scriptFileName.endsWith('.py')) {
            const runShContent = `
set -e # exit on error and use return code of last command as return code of script
clean_up () {
    ARG=$?
    chmod -R 777 * # make sure all files are readable by everyone so that they can be deleted even if owned by docker user
    exit $ARG
} 
trap clean_up EXIT
python3 ${scriptFileName}
`
            fs.writeFileSync(path.join(scriptJobDir, 'run.sh'), runShContent)
        }

        const uploadNbaOutput = async () => {
            const NbaOutput = await loadNbaOutput(`${scriptJobDir}/output`)
            console.info(`Uploading NBA output to ${scriptFileName}.out (${this.scriptJob.scriptJobId})`)
            await this._setProjectFile(`${scriptFileName}.out`, JSON.stringify(NbaOutput))
        }

        let consoleOutput = ''
        let lastUpdateConsoleOutputTimestamp = Date.now()
        const updateConsoleOutput = async () => {
            lastUpdateConsoleOutputTimestamp = Date.now()
            await this._setScriptJobProperty('consoleOutput', consoleOutput)
        }
        const timer = Date.now()
        try {
            await new Promise<void>((resolve, reject) => {
                let returned = false

                // const cmd = 'python'
                // const args = [scriptFileName]

                let cmd: string
                let args: string[]

                let containerMethod = this.config.computeResourceConfig.container_method
                if (scriptFileName.endsWith('.nba')) {
                    containerMethod = 'none'
                }

                const absScriptJobDir = path.resolve(scriptJobDir)

                if (containerMethod === 'singularity') {
                    cmd = 'singularity'
                    args = [
                        'exec',
                        '-C', // do not mount home directory, tmp directory, etc
                        '--pwd', '/working',
                        '--bind', `${absScriptJobDir}:/working`
                    ]
                    if (scriptFileName.endsWith('.py')) {
                        args = [...args, ...[
                            // '--cpus', `${this.jobSlot.num_cpus}`, // limit CPU - having trouble with this - cgroups issue
                            // '--memory', `${this.jobSlot.ram_gb}G`, // limit memory - for now disable because this option is not available on the FI cluster
                            'docker://magland/neurobass-default',
                            'bash', 'run.sh'
                        ]]
                    }
                    else if (scriptFileName.endsWith('.nba')) {
                        args = [...args, ...[
                            // '--cpus', `${this.jobSlot.num_cpus}`, // limit CPU - having trouble with this - cgroups issue
                            // '--memory', `${this.jobSlot.ram_gb}G`, // limit memory - for now disable because this option is not available on the FI cluster
                            'docker://magland/neurobass-default',
                            'bash', 'run.sh'
                        ]]
                    }
                    else {
                        throw Error(`Unsupported script file name: ${scriptFileName}`)
                    }
                }
                else if (containerMethod === 'docker') {
                    cmd = 'docker'
                    args = [
                        'run',
                        '--rm', // remove container after running
                        '-v', `${absScriptJobDir}:/working`,
                        '-w', '/working'
                    ]
                    if (scriptFileName.endsWith('.py')) {
                        args = [...args, ...[
                            '--cpus', `${this.jobSlot.num_cpus}`, // limit CPU
                            '--memory', `${this.jobSlot.ram_gb}g`, // limit memory
                            'magland/neurobass-default',
                            'bash',
                            '-c', `bash run.sh` // tricky - need to put the last two args together so that it ends up in a quoted argument
                        ]]
                    }
                    else if (scriptFileName.endsWith('.nba')) {
                        args = [...args, ...[
                            '--cpus', `${this.jobSlot.num_cpus}`, // limit CPU
                            '--memory', `${this.jobSlot.ram_gb}g`, // limit memory
                            'magland/neurobass-default',
                            'bash',
                            '-c', 'bash run.sh' // tricky - need to put the last two args together so that it ends up in a quoted argument
                        ]]
                    }
                    else {
                        throw Error(`Unsupported script file name: ${scriptFileName}`)
                    }
                }
                else if (containerMethod === 'none') {
                    cmd = 'bash'
                    args = ['run.sh']
                }
                else {
                    throw Error(`Unsupported container: ${containerMethod}`)
                }

                console.info('EXECUTING:', `${cmd} ${args.join(' ')}`)

                const timeoutSec: number = this.jobSlot.timeout_sec

                this.#childProcess = spawn(cmd, args, {
                    cwd: scriptJobDir
                })

                const timeoutId = setTimeout(() => {
                    if (returned) return
                    console.info(`Killing script job: ${this.scriptJob.scriptJobId} - ${this.scriptJob.scriptFileName} due to timeout`)
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
            })
        }
        catch (err) {
            await updateConsoleOutput()
            await this._setScriptJobProperty('error', err.message)
            await this._setScriptJobProperty('status', 'failed')
            this.#status = 'failed'

            const elapsedSec = (Date.now() - timer) / 1000
            await this._setScriptJobProperty('elapsedTimeSec', elapsedSec)

            this.#onCompletedOrFailedCallbacks.forEach(cb => cb())
            return
        }
        await updateConsoleOutput()

        if (scriptFileName.endsWith('.nba')) {
            await uploadNbaOutput()
        }
        else {
            const outputFileNames: string[] = []
            const files = fs.readdirSync(scriptJobDir)
            for (const file of files) {
                if ((file !== scriptFileName) && (file !== 'run.sh')) {
                    // check whether it is a file
                    const stat = fs.statSync(path.join(scriptJobDir, file))
                    if (stat.isFile()) {
                        outputFileNames.push(file)
                    }
                }
            }
            const maxOutputFiles = 5
            if (outputFileNames.length > maxOutputFiles) {
                console.info('Too many output files.')
                await this._setScriptJobProperty('error', 'Too many output files.')
                await this._setScriptJobProperty('status', 'failed')
                this.#status = 'failed'

                const elapsedSec = (Date.now() - timer) / 1000
                await this._setScriptJobProperty('elapsedTimeSec', elapsedSec)

                this.#onCompletedOrFailedCallbacks.forEach(cb => cb())
                return
            }
            for (const outputFileName of outputFileNames) {
                console.info('Uploading output file: ' + outputFileName)
                const content = fs.readFileSync(path.join(scriptJobDir, outputFileName), 'utf8')
                await this._setProjectFile(outputFileName, content)
            }
        }

        await this._setScriptJobProperty('status', 'completed')
        this.#status = 'completed'

        const elapsedSec = (Date.now() - timer) / 1000
        await this._setScriptJobProperty('elapsedTimeSec', elapsedSec)

        this.#onCompletedOrFailedCallbacks.forEach(cb => cb())
    }
}

const createMountainsort5RunPyContent = (nbaFileName: string): string => {
    return `import yaml
from typing import Union, List
import os
import time
import json
import numpy as np
import mountainsort5 as ms5
import h5py
import pynwb
from uuid import uuid4
from pynwb.misc import Units
import remfile
import spikeinterface as si
import spikeinterface.preprocessing as spre

import boto3
import botocore

CLOUDFLARE_ACCOUNT_ID = os.environ['CLOUDFLARE_ACCOUNT_ID']
CLOUDFLARE_AWS_ACCESS_KEY_ID = os.environ['CLOUDFLARE_AWS_ACCESS_KEY_ID']
CLOUDFLARE_AWS_SECRET_ACCESS_KEY = os.environ['CLOUDFLARE_AWS_SECRET_ACCESS_KEY']
CLOUDFLARE_BUCKET = os.environ['CLOUDFLARE_BUCKET']
CLOUDFLARE_BUCKET_BASE_URL = os.environ['CLOUDFLARE_BUCKET_BASE_URL']

s3 = boto3.client('s3',
  endpoint_url = f'https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com',
  aws_access_key_id = CLOUDFLARE_AWS_ACCESS_KEY_ID,
  aws_secret_access_key = CLOUDFLARE_AWS_SECRET_ACCESS_KEY
)


def main():
    with open('${nbaFileName}', 'r') as f:
        nba = yaml.safe_load(f)

    recording_nwb_file_name = nba['recording_nwb_file']
    recording_electrical_series_path = nba['recording_electrical_series_path']

    # get the nwb url
    with open(recording_nwb_file_name, 'r') as f:
        nwb_url = json.load(f)['url']

    # open the remote file
    disk_cache = remfile.DiskCache('/tmp/remfile_cache')
    remf = remfile.File(nwb_url, disk_cache=disk_cache)
    f = h5py.File(remf, 'r')

    recording = NwbRecording(
        file=f,
        electrical_series_path=recording_electrical_series_path
    )

    # Make sure the recording is preprocessed appropriately
    # lazy preprocessing
    recording_filtered = spre.bandpass_filter(recording, freq_min=300, freq_max=6000)
    recording_preprocessed: si.BaseRecording = spre.whiten(recording_filtered, dtype='float32')

    sorting_params = ms5.Scheme2SortingParameters(
        phase1_detect_channel_radius=50,
        detect_channel_radius=50
    )
    sorting = ms5.sorting_scheme2(
        recording=recording_preprocessed,
        sorting_parameters=sorting_params
    )

    with pynwb.NWBHDF5IO(file=h5py.File(remf, 'r'), mode='r') as io:
        nwbfile_rec = io.read()

        nwbfile = pynwb.NWBFile(
            session_description=nwbfile_rec.session_description,
            identifier=str(uuid4()),
            session_start_time=nwbfile_rec.session_start_time,
            experimenter=nwbfile_rec.experimenter,
            experiment_description=nwbfile_rec.experiment_description,
            lab=nwbfile_rec.lab,
            institution=nwbfile_rec.institution,
            subject=pynwb.file.Subject(
                subject_id=nwbfile_rec.subject.subject_id,
                age=nwbfile_rec.subject.age,
                date_of_birth=nwbfile_rec.subject.date_of_birth,
                sex=nwbfile_rec.subject.sex,
                species=nwbfile_rec.subject.species,
                description=nwbfile_rec.subject.description
            ),
            session_id=nwbfile_rec.session_id,
            keywords=nwbfile_rec.keywords
        )

        for unit_id in sorting.get_unit_ids():
            st = sorting.get_unit_spike_train(unit_id) / sorting.get_sampling_frequency()
            nwbfile.add_unit(
                id=unit_id,
                spike_times=st
            )
        
        if not os.path.exists('output'):
            os.mkdir('output')
        sorting_fname = 'output/sorting.nwb'

        # Write the nwb file
        with pynwb.NWBHDF5IO(sorting_fname, 'w') as io:
            io.write(nwbfile, cache_spec=True)
        
        random_output_id = str(uuid4())[0:8]

        s3.upload_file(sorting_fname, CLOUDFLARE_BUCKET, f'neurobass-dev/{random_output_id}.nwb')
        # for now we hard-code neurosift.org
        url = f'{CLOUDFLARE_BUCKET_BASE_URL}/neurobass-dev/{random_output_id}.nwb'
        out = {
            'sorting_nwb_file': url
        }
        with open('output/out.json', 'w') as f:
            json.dump(out, f)

class NwbRecording(si.BaseRecording):
    def __init__(self,
        file: h5py.File,
        electrical_series_path: str
    ) -> None:
        electrical_series = file[electrical_series_path]
        electrical_series_data = electrical_series['data']
        dtype = electrical_series_data.dtype

        # Get sampling frequency
        if 'starting_time' in electrical_series.keys():
            t_start = electrical_series['starting_time'][()]
            sampling_frequency = electrical_series['starting_time'].attrs['rate']
        elif 'timestamps' in electrical_series.keys():
            t_start = electrical_series['timestamps'][0]
            sampling_frequency = 1 / np.median(np.diff(electrical_series['timestamps'][:1000]))
        
        # Get channel ids
        electrode_indices = electrical_series['electrodes'][:]
        electrodes_table = file['/general/extracellular_ephys/electrodes']
        channel_ids = [electrodes_table['id'][i] for i in electrode_indices]
        
        si.BaseRecording.__init__(self, channel_ids=channel_ids, sampling_frequency=sampling_frequency, dtype=dtype)
        
        # Set electrode locations
        if 'x' in electrodes_table:
            channel_loc_x = [electrodes_table['x'][i] for i in electrode_indices]
            channel_loc_y = [electrodes_table['y'][i] for i in electrode_indices]
            if 'z' in electrodes_table:
                channel_loc_z = [electrodes_table['z'][i] for i in electrode_indices]
            else:
                channel_loc_z = None
        elif 'rel_x' in electrodes_table:
            channel_loc_x = [electrodes_table['rel_x'][i] for i in electrode_indices]
            channel_loc_y = [electrodes_table['rel_y'][i] for i in electrode_indices]
            if 'rel_z' in electrodes_table:
                channel_loc_z = [electrodes_table['rel_z'][i] for i in electrode_indices]
            else:
                channel_loc_z = None
        else:
            channel_loc_x = None
            channel_loc_y = None
            channel_loc_z = None
        if channel_loc_x is not None:
            ndim = 2 if channel_loc_z is None else 3
            locations = np.zeros((len(electrode_indices), ndim), dtype=float)
            for i, electrode_index in enumerate(electrode_indices):
                locations[i, 0] = channel_loc_x[electrode_index]
                locations[i, 1] = channel_loc_y[electrode_index]
                if channel_loc_z is not None:
                    locations[i, 2] = channel_loc_z[electrode_index]
            self.set_dummy_probe_from_locations(locations)

        recording_segment = NwbRecordingSegment(
            electrical_series_data=electrical_series_data,
            sampling_frequency=sampling_frequency
        )
        self.add_recording_segment(recording_segment)

class NwbRecordingSegment(si.BaseRecordingSegment):
    def __init__(self, electrical_series_data: h5py.Dataset, sampling_frequency: float) -> None:
        self._electrical_series_data = electrical_series_data
        si.BaseRecordingSegment.__init__(self, sampling_frequency=sampling_frequency)

    def get_num_samples(self) -> int:
        return self._electrical_series_data.shape[0]

    def get_traces(self, start_frame: int, end_frame: int, channel_indices: Union[List[int], None]=None) -> np.ndarray:
        if channel_indices is None:
            return self._electrical_series_data[start_frame:end_frame, :]
        else:
            return self._electrical_series_data[start_frame:end_frame, channel_indices]

if __name__ == '__main__':
    main()
`
}

const loadNbaOutput = async (outputDir: string): Promise<NbaOutput> => {
    const output = await fs.promises.readFile(path.join(outputDir, 'out.json'), {encoding: 'utf8'})
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

const removeOccupiedJobSlots = (jobSlots: {count: number, num_cpus: number, ram_gb: number, timeout_sec: number}[], runningJobs: RunningJob[]): {count: number, num_cpus: number, ram_gb: number, timeout_sec: number}[] => {
    const ret: {count: number, num_cpus: number, ram_gb: number, timeout_sec: number}[] = []
    for (const js of jobSlots) {
        ret.push({...js})
    }
    for (const job of runningJobs) {
        for (const js of ret) {
            if (jobFitsInJobSlot(js, job.scriptJob)) {
                js.count -= 1
                break
            }
        }
    }
    return ret
}

const jobFitsInJobSlot = (jobSlot: {count: number, num_cpus: number, ram_gb: number, timeout_sec: number}, job: SPScriptJob): boolean => {
    if (jobSlot.count <= 0) {
        return false
    }
    if ((job.requiredResources?.numCpus || 1) > jobSlot.num_cpus) {
        return false
    }
    if ((job.requiredResources?.ramGb || 1) > jobSlot.ram_gb) {
        return false
    }
    if ((job.requiredResources?.timeoutSec || 10) > jobSlot.timeout_sec) {
        return false
    }
    return true
}

const getAvailableJobSlot = (jobSlots: {count: number, num_cpus: number, ram_gb: number, timeout_sec: number}[], job: SPScriptJob): {num_cpus: number, ram_gb: number, timeout_sec: number} | undefined => {
    for (const js of jobSlots) {
        if (js.count > 0) {
            if (jobFitsInJobSlot(js, job)) {
                return {
                    num_cpus: js.num_cpus,
                    ram_gb: js.ram_gb,
                    timeout_sec: js.timeout_sec
                }
            }
        }
    }
    return undefined
}

export default ScriptJobManager