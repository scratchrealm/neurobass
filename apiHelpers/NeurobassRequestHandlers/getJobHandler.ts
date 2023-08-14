import { GetJobRequest, GetJobResponse } from "../../src/types/NeurobassRequest";
import { isNBJob } from "../../src/types/neurobass-types";
import getProject from "../getProject";
import { getMongoClient } from "../getMongoClient";
import getWorkspace from "../getWorkspace";
import { userCanReadWorkspace } from "../permissions";
import removeIdField from "../removeIdField";

const getJob = async (request: GetJobRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<GetJobResponse> => {
    const client = await getMongoClient()
    const jobsCollection = client.db('neurobass').collection('jobs')

    const project = await getProject(request.projectId, {useCache: true})
    
    const workspaceId = project.workspaceId
    const workspace = await getWorkspace(workspaceId, {useCache: true})
    if (!userCanReadWorkspace(workspace, o.verifiedUserId, o.verifiedClientId)) {
        throw new Error('User does not have permission to read this workspace')
    }
    if (request.workspaceId !== workspaceId) {
        throw new Error('workspaceId does not match project.workspaceId')
    }
    
    const job = removeIdField(await jobsCollection.findOne({
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        jobId: request.jobId
    }))
    if (!job) {
        throw new Error(`No job with ID ${request.jobId}`)
    }
    if (!isNBJob(job)) {
        console.warn(job)
        throw new Error('Invalid job in database (2)')
    }
    return {
        type: 'getJob',
        job
    }
}

export default getJob