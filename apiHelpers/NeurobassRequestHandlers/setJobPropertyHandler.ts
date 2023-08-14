import { SetJobPropertyRequest, SetJobPropertyResponse } from "../../src/types/NeurobassRequest";
import { isNBJob } from "../../src/types/neurobass-types";
import { getMongoClient } from "../getMongoClient";
import getPubnubClient from "../getPubnubClient";
import removeIdField from "../removeIdField";

const setJobPropertyHandler = async (request: SetJobPropertyRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<SetJobPropertyResponse> => {
    const {verifiedClientId} = o

    if (!verifiedClientId) {
        throw new Error('Only compute resources can set job properties')
    }

    const client = await getMongoClient()

    const jobsCollection = client.db('neurobass').collection('jobs')
    const job = removeIdField(await jobsCollection.findOne({
        jobId: request.jobId
    }))
    if (!job) {
        throw new Error(`No job with ID ${request.jobId}`)
    }
    if (!isNBJob(job)) {
        console.warn(job)

        throw new Error('Invalid job in database (4)')
    }
    if ((job.projectId !== request.projectId) || (job.workspaceId !== request.workspaceId)) {
        throw new Error(`Job ID ${request.jobId} does not match projectId ${request.projectId} and workspaceId ${request.workspaceId}`)
    }
    if (job.computeResourceId !== verifiedClientId) {
        throw new Error(`Job ID ${request.jobId} does not match verifiedClientId ${verifiedClientId}`)
    }

    const update: {[k: string]: any} = {}

    if (request.property === 'status') {
        update.status = request.value
        if (request.value === 'running') {
            update.timestampRunning = Date.now() / 1000
        }
        else if (request.value === 'queued') {
            update.timestampQueued = Date.now() / 1000
        }
        else if (request.value === 'completed') {
            update.timestampFinished = Date.now() / 1000
        }
        else if (request.value === 'failed') {
            update.timestampFinished = Date.now() / 1000
        }
    }
    else if (request.property === 'error') {
        update.error = request.value
    }
    else if (request.property === 'processVersion') {
        update.processVersion = request.value
    }
    else if (request.property === 'consoleOutput') {
        update.consoleOutput = request.value
    }
    else {
        throw new Error(`Invalid property: ${request.property}`)
    }

    if (request.computeResourceNodeId) {
        update.computeResourceNodeId = request.computeResourceNodeId
    }
    if (request.computeResourceNodeName) {
        update.computeResourceNodeName = request.computeResourceNodeName
    }

    if ((request.property === 'status') && (request.value === 'completed')) {
        const filesCollection = client.db('neurobass').collection('files')

        const newOutputFiles: {
            name: string
            fileName: string
            fileId: string
        }[] = []
        const newOutputFileIds: string[] = []
        for (const outputFile of job.outputFiles) {
            const ff = removeIdField(await filesCollection.findOne({
                projectId: request.projectId,
                fileName: outputFile.fileName
            }))
            if (!ff) {
                throw new Error(`Project output file does not exist: ${outputFile.fileName}`)
            }
            newOutputFiles.push({
                name: outputFile.name,
                fileName: outputFile.fileName,
                fileId: ff.fileId
            })
            newOutputFileIds.push(ff.fileId)
        }
        update.outputFiles = newOutputFiles
        update.outputFileIds = newOutputFileIds
    }

    const filter: {[key: string]: any} = {jobId: request.jobId}
    if (request.property === 'status') {
        if (request.value === 'running') {
            filter.status = 'pending' // previous status must be pending (this is important to allow multiple compute resource services to run at the same time)
        }
        else if (request.value === 'completed') {
            filter.status = 'running' // previous status must be running
        }
        else if (request.value === 'failed') {
            filter.status = 'running' // previous status must be running
        }
        else {
            throw new Error(`Invalid status: ${request.value}`)
        }
    }

    const x = await jobsCollection.updateOne(filter, {$set: update})
    if (x.modifiedCount === 0) {
        return {
            type: 'setJobProperty',
            success: false,
            error: 'Failed to set job property.'
        }
    }
    if (x.modifiedCount > 1) {
        throw new Error(`Unexpected: modified ${x.modifiedCount} > 1 jobs`)
    }

    if (request.property === 'status') {
        const pnClient = await getPubnubClient()
        if (pnClient) {
            await pnClient.publish({
                channel: job.computeResourceId,
                message: {
                    type: 'jobStatusChanged',
                    workspaceId: request.workspaceId,
                    projectId: request.projectId,
                    jobId: job.jobId,
                    status: request.value
                }
            })
        }
    }

    return {
        type: 'setJobProperty',
        success: true
    }
}

export default setJobPropertyHandler