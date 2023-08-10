import { GetScriptJobsRequest, GetScriptJobsResponse } from "../../src/types/NeurobassRequest";
import { isSPScriptJob } from "../../src/types/neurobass-types";
import { getMongoClient } from "../getMongoClient";
import removeIdField from "../removeIdField";

const getScriptJobsHandler = async (request: GetScriptJobsRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<GetScriptJobsResponse> => {
    // must provide either computeResourceId or projectId
    if (!request.computeResourceId && !request.projectId) {
        throw new Error('No computeResourceId or projectId provided')
    }

    const client = await getMongoClient()
    const scriptJobsCollection = client.db('neurobass').collection('scriptJobs')

    const filter: {[k: string]: any} = {}
    if (request.computeResourceId) {
        filter['computeResourceId'] = request.computeResourceId
    }
    if (request.status) {
        filter['status'] = request.status
    }
    if (request.projectId) {
        filter['projectId'] = request.projectId
    }

    const scriptJobs = removeIdField(await scriptJobsCollection.find(filter).toArray())
    for (const scriptJob of scriptJobs) {
        if (!isSPScriptJob(scriptJob)) {
            console.warn(JSON.stringify(scriptJob, null, 2))
            console.warn('Invalid script job in database (0)')

            // // one-off correction, delete invalid script job
            // await scriptJobsCollection.deleteOne({
            //     scriptJobId: scriptJob.scriptJobId
            // })

            throw new Error('Invalid script job in database (0)')
        }
    }

    if ((o.verifiedClientId) && (o.verifiedClientId === request.computeResourceId) && (request.nodeId) && (request.nodeName)) {
        const computeResourceNodesCollection = client.db('neurobass').collection('computeResourceNodes')
        await computeResourceNodesCollection.updateOne({
            computeResourceId: request.computeResourceId,
            nodeId: request.nodeId,
        }, {
            $set: {
                timestampLastActive: Date.now() / 1000,
                computeResourceId: request.computeResourceId,
                nodeId: request.nodeId,
                nodeName: request.nodeName
            }
        }, {
            upsert: true
        })
    }

    return {
        type: 'getScriptJobs',
        scriptJobs
    }
}

export default getScriptJobsHandler