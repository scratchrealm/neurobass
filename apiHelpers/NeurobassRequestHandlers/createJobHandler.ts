import { NBJob } from "../../src/types/neurobass-types";
import { CreateJobRequest, CreateJobResponse } from "../../src/types/NeurobassRequest";
import createRandomId from "../createRandomId";
import { getMongoClient } from "../getMongoClient";
import getProject from "../getProject";
import getPubnubClient from "../getPubnubClient";
import getWorkspace from "../getWorkspace";
import getWorkspaceRole from "../getWorkspaceRole";

const createJobHandler = async (request: CreateJobRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<CreateJobResponse> => {
    const userId = o.verifiedUserId
    const workspaceId = request.workspaceId

    const workspace = await getWorkspace(workspaceId, {useCache: false})
    const workspaceRole = getWorkspaceRole(workspace, userId)

    if (!userId) {
        throw new Error('User must be logged in to create jobs')
    }

    const canEdit = workspaceRole === 'admin' || workspaceRole === 'editor'
    if (!canEdit) {
        throw new Error('User does not have permission to create jobs')
    }

    let computeResourceId = workspace.computeResourceId
    if (!computeResourceId) {
        computeResourceId = process.env.VITE_DEFAULT_COMPUTE_RESOURCE_ID
        if (!computeResourceId) {
            throw new Error('Workspace does not have a compute resource ID, and no default VITE_DEFAULT_COMPUTE_RESOURCE_ID is set in the environment.')
        }
    }

    const project = await getProject(request.projectId, {useCache: false})
    // important to check this
    if (project.workspaceId !== workspaceId) {
        throw new Error('Incorrect workspace ID')
    }

    const client = await getMongoClient()

    const jobId = createRandomId(8)

    const job: NBJob = {
        jobId,
        workspaceId,
        projectId: request.projectId,
        userId,
        processType: request.processType,
        inputFiles: request.inputFiles,
        inputFileIds: request.inputFiles.map(x => x.fileId),
        inputParameters: request.inputParameters,
        outputFiles: request.outputFiles,
        timestampCreated: Date.now() / 1000,
        computeResourceId,
        status: 'pending'
    }
    const jobsCollection = client.db('neurobass').collection('jobs')
    await jobsCollection.insertOne(job)

    const pnClient = await getPubnubClient()
    if (pnClient) {
        await pnClient.publish({
            channel: computeResourceId,
            message: {
                type: 'newPendingJob',
                workspaceId,
                projectId: request.projectId,
                jobId
            }
        })
    }

    return {
        type: 'createJob',
        jobId
    }
}

export default createJobHandler