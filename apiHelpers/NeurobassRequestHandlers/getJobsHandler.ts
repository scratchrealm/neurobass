import { GetJobsRequest, GetJobsResponse } from "../../src/types/NeurobassRequest";
import { isNBJob } from "../../src/types/neurobass-types";
import { getMongoClient } from "../getMongoClient";
import removeIdField from "../removeIdField";

const getJobsHandler = async (request: GetJobsRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<GetJobsResponse> => {
    // must provide either computeResourceId or projectId
    if (!request.computeResourceId && !request.projectId) {
        throw new Error('No computeResourceId or projectId provided')
    }

    const client = await getMongoClient()
    const jobsCollection = client.db('neurobass').collection('jobs')

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

    const jobs = removeIdField(await jobsCollection.find(filter).toArray())
    for (const job of jobs) {
        if (!isNBJob(job)) {
            console.warn(JSON.stringify(job, null, 2))
            console.warn('Invalid job in database (0)')

            // // one-off correction, delete invalid job
            // await jobsCollection.deleteOne({
            //     jobId: job.jobId
            // })

            throw new Error('Invalid job in database (0)')
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
        type: 'getJobs',
        jobs
    }
}

export default getJobsHandler