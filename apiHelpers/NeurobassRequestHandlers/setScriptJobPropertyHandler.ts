import { SetScriptJobPropertyRequest, SetScriptJobPropertyResponse } from "../../src/types/NeurobassRequest";
import { isSPScriptJob } from "../../src/types/neurobass-types";
import { getMongoClient } from "../getMongoClient";
import getPubnubClient from "../getPubnubClient";
import removeIdField from "../removeIdField";

const setScriptJobPropertyHandler = async (request: SetScriptJobPropertyRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<SetScriptJobPropertyResponse> => {
    const {verifiedClientId} = o

    if (!verifiedClientId) {
        throw new Error('Only compute resources can set script job properties')
    }

    const client = await getMongoClient()

    const scriptJobsCollection = client.db('neurobass').collection('scriptJobs')
    const scriptJob = removeIdField(await scriptJobsCollection.findOne({
        scriptJobId: request.scriptJobId
    }))
    if (!scriptJob) {
        throw new Error(`No script job with ID ${request.scriptJobId}`)
    }
    if (!isSPScriptJob(scriptJob)) {
        console.warn(scriptJob)
        throw new Error('Invalid script job in database (4)')
    }
    if ((scriptJob.projectId !== request.projectId) || (scriptJob.workspaceId !== request.workspaceId)) {
        throw new Error(`Script job ID ${request.scriptJobId} does not match projectId ${request.projectId} and workspaceId ${request.workspaceId}`)
    }
    if (scriptJob.computeResourceId !== verifiedClientId) {
        throw new Error(`Script job ID ${request.scriptJobId} does not match verifiedClientId ${verifiedClientId}`)
    }

    const update: {[k: string]: any} = {}

    if (request.property === 'status') {
        update.status = request.value
    }
    else if (request.property === 'error') {
        update.error = request.value
    }
    else if (request.property === 'consoleOutput') {
        update.consoleOutput = request.value
    }
    else if (request.property === 'elapsedTimeSec') {
        update.elapsedTimeSec = request.value
    }
    else {
        throw new Error(`Invalid property: ${request.property}`)
    }
    update.timestampModified = Date.now() / 1000

    if (request.computeResourceNodeId) {
        update.computeResourceNodeId = request.computeResourceNodeId
    }
    if (request.computeResourceNodeName) {
        update.computeResourceNodeName = request.computeResourceNodeName
    }

    const filter: {[key: string]: any} = {scriptJobId: request.scriptJobId}
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
    const x = await scriptJobsCollection.updateOne(filter, {$set: update})
    if (x.modifiedCount === 0) {
        return {
            type: 'setScriptJobProperty',
            success: false,
            error: 'Failed to set script job property.'
        }
    }
    if (x.modifiedCount > 1) {
        throw new Error(`Unexpected: modified ${x.modifiedCount} > 1 script jobs`)
    }

    if (request.property === 'status') {
        const pnClient = await getPubnubClient()
        if (pnClient) {
            await pnClient.publish({
                channel: scriptJob.computeResourceId,
                message: {
                    type: 'scriptJobStatusChanged',
                    workspaceId: request.workspaceId,
                    projectId: request.projectId,
                    scriptFileName: scriptJob.scriptFileName,
                    scriptJobId: scriptJob.scriptJobId,
                    status: request.value
                }
            })
        }
    }

    return {
        type: 'setScriptJobProperty',
        success: true
    }
}

export default setScriptJobPropertyHandler