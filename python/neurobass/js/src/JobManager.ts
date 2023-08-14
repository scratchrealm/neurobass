import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import postNeurobassRequestFromComputeResource from "./postNeurobassRequestFromComputeResource";
import { NBFile, NBJob } from "./types/neurobass-types";
import { GetDataBlobRequest, GetFileRequest, GetFilesRequest, NeurobassResponse, SetFileRequest, SetJobPropertyRequest } from "./types/NeurobassRequest";


export const getPresetConfig = () => {
    // hard-code this as flatiron for now
    return process.env.PRESET_CONFIG || 'flatiron'
}
const presetConfig = getPresetConfig()

type SortingOutput = {
    output_file_url: string
    output_file_size: number
}

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
        // list all folders in script_jobs directory
        const jobsDir = path.join(this.config.dir, 'script_jobs')
        if (!fs.existsSync(jobsDir)) {
            return
        }
        const folders = await fs.promises.readdir(jobsDir)
        for (const folder of folders) {
            const folderPath = path.join(this.config.dir, 'script_jobs', folder)
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
        console.info(`Initiating job: ${this.job.jobId} - ${this.job.processType}`)
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
            throw Error('Unable to set job property')
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
    private async _loadFileData(fileName: string): Promise<string> {
        const cc = await this._loadFileContentString(fileName)
        if (cc.startsWith('data:')) {
            return cc.slice('data:'.length)
        }
        else if (cc.startsWith('blob:')) {
            return await this._loadDataBlob(cc.slice('blob:'.length))
        }
        else {
            throw Error('Unable to load file content: ' + fileName + ' ' + cc)
        }
    }
    private async _loadFileContentString(fileName: string): Promise<string> {
        const req: GetFileRequest = {
            type: 'getFile',
            timestamp: Date.now() / 1000,
            projectId: this.job.projectId,
            fileName
        }
        const resp = await this._postNeurobassRequest(req)
        if (!resp) {
            throw Error('Unable to get project file')
        }
        if (resp.type !== 'getFile') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected getFile')
        }
        return resp.file.content
    }
    private async _loadDataBlob(sha1: string): Promise<string> {
        const req: GetDataBlobRequest = {
            type: 'getDataBlob',
            timestamp: Date.now() / 1000,
            workspaceId: this.job.workspaceId,
            projectId: this.job.projectId,
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
    async _setFile(fileName: string, fileContent: string) {
        const req: SetFileRequest = {
            type: 'setFile',
            timestamp: Date.now() / 1000,
            workspaceId: this.job.workspaceId,
            projectId: this.job.projectId,
            fileName,
            fileData: fileContent,
            size: fileContent.length,
            metadata: {}
        }
        const resp = await this._postNeurobassRequest(req)
        if (!resp) {
            throw Error('Unable to set project file')
        }
        if (resp.type !== 'setFile') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected setFile')
        }
    }
    async _setUrlFile(fileName: string, url: string, size: number) {
        const req: SetFileRequest = {
            type: 'setFile',
            timestamp: Date.now() / 1000,
            workspaceId: this.job.workspaceId,
            projectId: this.job.projectId,
            fileName,
            content: `url:${url}`,
            size,
            metadata: {}
        }
        const resp = await this._postNeurobassRequest(req)
        if (!resp) {
            throw Error('Unable to set project file')
        }
        if (resp.type !== 'setFile') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected setFile')
        }
    }
    private async _loadFiles(projectId: string): Promise<NBFile[]> {
        const req: GetFilesRequest = {
            type: 'getFiles',
            timestamp: Date.now() / 1000,
            projectId
        }
        const resp = await this._postNeurobassRequest(req)
        if (!resp) {
            throw Error('Unable to get project')
        }
        if (resp.type !== 'getFiles') {
            console.warn(resp)
            throw Error('Unexpected response type. Expected getFiles')
        }
        return resp.files
    }
    private async _run() {
        if (this.#childProcess) {
            throw Error('Unexpected: Child process already running')
        }

        let consoleOutput = ''
        let lastUpdateConsoleOutputTimestamp = Date.now()
        const updateConsoleOutput = async () => {
            lastUpdateConsoleOutputTimestamp = Date.now()
            await this._setJobProperty('consoleOutput', consoleOutput)
        }
        try {
            const processType = this.job.processType
            if (!['script', 'mountainsort5', 'kilosort3'].includes(processType)) {
                throw Error(`Unexpected process type: ${processType}`)
            }
            const jobDir = path.join(process.env.COMPUTE_RESOURCE_DIR, 'script_jobs', this.job.jobId)
            fs.mkdirSync(jobDir, {recursive: true})

            const files = await this._loadFiles(this.job.projectId)

            let scriptPyFileName = ''
            if (processType === 'script') {
                scriptPyFileName = (this.job.inputParameters.find(p => (p.name === 'script_file')) || {}).value
                if (!scriptPyFileName) {
                    throw Error('Missing script_file parameter')
                }
                if (!scriptPyFileName.endsWith('.py')) {
                    throw Error('Only python scripts are supported')
                }
                const scriptFileContent = await this._loadFileData(scriptPyFileName)
                fs.writeFileSync(path.join(jobDir, scriptPyFileName), scriptFileContent)
                for (const pf of files) {
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
                        const content = await this._loadFileData(pf.fileName)
                        fs.writeFileSync(path.join(jobDir, pf.fileName), content)
                    }
                }
                const runShContent = `
set -e # exit on error and use return code of last command as return code of script
clean_up () {
    ARG=$?
    chmod -R 777 * # make sure all files are readable by everyone so that they can be deleted even if owned by docker user
    exit $ARG
} 
trap clean_up EXIT
python3 ${scriptPyFileName}
`
                fs.writeFileSync(path.join(jobDir, 'run.sh'), runShContent)
            }
            if (['mountainsort5', 'kilosort3'].includes(processType)) {
                let analysisRunPrefix = process.env.ANALYSIS_RUN_PREFIX || ''
                if ((!analysisRunPrefix) && (presetConfig === 'flatiron')) {
                    if (processType === 'kilosort3') {
                        analysisRunPrefix = 'srun -p gpu --gpus-per-task 1 --gpus 1 -t 0-4:00'
                    }
                }

                const analysisScriptsDir = process.env.ANALYSIS_SCRIPTS_DIR
                if (!analysisScriptsDir) throw Error('ANALYSIS_SCRIPTS_DIR environment variable not set.')

                const recordingNwbFile = this.job.inputFiles.find(f => (f.name === 'input'))?.fileName
                if (!recordingNwbFile) {
                    throw Error('Missing input file')
                }

                let runPyContent: string

                const x = files.find(pf => pf.fileName === recordingNwbFile)
                if (!x) {
                    throw new Error(`Unable to find recording_nwb_file: ${recordingNwbFile}`)
                }
                const cs = await this._loadFileContentString(recordingNwbFile)
                if (!cs.startsWith('url:')) {
                    throw Error('Unexpected file content string: ' + cs)
                }
                const nwbUrl = cs.slice('url:'.length)
                if (processType === 'mountainsort5') {
                    runPyContent = fs.readFileSync(path.join(analysisScriptsDir, 'analysis_mountainsort5.py'), 'utf8')
                }
                else if (processType === 'kilosort3') {
                    runPyContent = fs.readFileSync(path.join(analysisScriptsDir, 'analysis_kilosort3.py'), 'utf8')
                }
                
                fs.writeFileSync(path.join(jobDir, 'run.py'), runPyContent)

                // write all the .py files in the analysisScriptsDir/helpers
                fs.mkdirSync(path.join(jobDir, 'helpers'), {recursive: true})
                const helpersDir = path.join(analysisScriptsDir, 'helpers')
                const helperFiles = fs.readdirSync(helpersDir)
                for (const helperFile of helperFiles) {
                    if (helperFile.endsWith('.py')) {
                        const helperFileContent = fs.readFileSync(path.join(helpersDir, helperFile), 'utf8')
                        fs.writeFileSync(path.join(jobDir, 'helpers', helperFile), helperFileContent)
                    }
                }

                const runShContent = `
set -e # exit on error and use return code of last command as return code of script
clean_up () {
    ARG=$?
    chmod -R 777 * # make sure all files are readable by everyone so that they can be deleted even if owned by docker user
    exit $ARG
} 
trap clean_up EXIT
export INPUT_NWB_URL="${nwbUrl}"
${analysisRunPrefix ? analysisRunPrefix + ' ' : ''}python3 run.py
`
                fs.writeFileSync(path.join(jobDir, 'run.sh'), runShContent)
            }

            await new Promise<void>((resolve, reject) => {
                let returned = false

                // const cmd = 'python'
                // const args = [scriptFileName]

                let cmd: string
                let args: string[]

                let containerMethod = process.env.CONTAINER_METHOD || 'none'
                if (processType !== 'script') {
                    containerMethod = 'none'
                }

                const absJobDir = path.resolve(jobDir)

                if (containerMethod === 'singularity') {
                    cmd = 'singularity'
                    args = [
                        'exec',
                        '-C', // do not mount home directory, tmp directory, etc
                        '--pwd', '/working',
                        '--bind', `${absJobDir}:/working`
                    ]
                    if (processType === 'script') {
                        args = [...args, ...[
                            // '--cpus', `${this.jobSlot.num_cpus}`, // limit CPU - having trouble with this - cgroups issue
                            // '--memory', `${this.jobSlot.ram_gb}G`, // limit memory - for now disable because this option is not available on the FI cluster
                            'docker://magland/neurobass-default',
                            'bash', 'run.sh'
                        ]]
                    }
                    else {
                        args = [...args, ...[
                            // '--cpus', `${this.jobSlot.num_cpus}`, // limit CPU - having trouble with this - cgroups issue
                            // '--memory', `${this.jobSlot.ram_gb}G`, // limit memory - for now disable because this option is not available on the FI cluster
                            'docker://magland/neurobass-default',
                            'bash', 'run.sh'
                        ]]
                    }
                }
                else if (containerMethod === 'docker') {
                    cmd = 'docker'
                    args = [
                        'run',
                        '--rm', // remove container after running
                        '-v', `${absJobDir}:/working`,
                        '-w', '/working'
                    ]
                    if (processType === 'singularity') {
                        const num_cpus = 2
                        const ram_gb = 2
                        args = [...args, ...[
                            '--cpus', `${num_cpus}`, // limit CPU
                            '--memory', `${ram_gb}g`, // limit memory
                            'magland/neurobass-default',
                            'bash',
                            '-c', `bash run.sh` // tricky - need to put the last two args together so that it ends up in a quoted argument
                        ]]
                    }
                    else {
                        args = [...args, ...[
                            'magland/neurobass-default',
                            'bash',
                            '-c', 'bash run.sh' // tricky - need to put the last two args together so that it ends up in a quoted argument
                        ]]
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

                const timeoutSec = 60 * 60 * 3 // 3 hours

                this.#childProcess = spawn(cmd, args, {
                    cwd: jobDir
                })

                const timeoutId = setTimeout(() => {
                    if (returned) return
                    console.info(`Killing job: ${this.job.jobId} - ${processType} due to timeout`)
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
            
            await updateConsoleOutput()

            if (processType === 'script') {
                const outputFileNames: string[] = []
                const files = fs.readdirSync(jobDir)
                for (const file of files) {
                    if ((file !== scriptPyFileName) && (file !== 'run.sh')) {
                        // check whether it is a file
                        const stat = fs.statSync(path.join(jobDir, file))
                        if (stat.isFile()) {
                            outputFileNames.push(file)
                        }
                    }
                }
                const maxOutputFiles = 5
                if (outputFileNames.length > maxOutputFiles) {
                    console.info('Too many output files.')
                    await this._setJobProperty('error', 'Too many output files.')
                    await this._setJobProperty('status', 'failed')
                    this.#status = 'failed'

                    this.#onCompletedOrFailedCallbacks.forEach(cb => cb())
                    return
                }
                for (const outputFileName of outputFileNames) {
                    console.info('Uploading output file: ' + outputFileName)
                    const content = fs.readFileSync(path.join(jobDir, outputFileName), 'utf8')
                    await this._setFile(outputFileName, content)
                }
            }
            else {
                // spike sorting output
                const out = await loadOutputJson(jobDir)
                const outputFileName = this.job.outputFiles.find(f => (f.name === 'output'))?.fileName
                if (!outputFileName) {
                    throw Error('No output file specified')
                }
                await this._setUrlFile(outputFileName, out.output_file_url, out.output_file_size)
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

const loadOutputJson = async (jobDir: string): Promise<SortingOutput> => {
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