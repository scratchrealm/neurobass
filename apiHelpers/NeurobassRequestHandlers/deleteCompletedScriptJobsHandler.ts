import { DeleteCompletedScriptJobsRequest, DeleteCompletedScriptJobsResponse } from "../../src/types/NeurobassRequest";
import getProject from "../getProject";
import { getMongoClient } from "../getMongoClient";
import getWorkspace from "../getWorkspace";
import getWorkspaceRole from "../getWorkspaceRole";

const deleteCompletedScriptJobsHandler = async (request: DeleteCompletedScriptJobsRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<DeleteCompletedScriptJobsResponse> => {
    const {verifiedUserId} = o

    const client = await getMongoClient()

    const workspace = await getWorkspace(request.workspaceId, {useCache: false})
    const workspaceRole = getWorkspaceRole(workspace, verifiedUserId)
    const okay = workspaceRole === 'admin' || workspaceRole === 'editor'
    if (!okay) {
        throw new Error('User does not have permission to delete script jobs in this workspace')
    }

    const project = await getProject(request.projectId, {useCache: false})
    // important to check this
    if (project.workspaceId !== request.workspaceId) {
        throw new Error('Incorrect workspace ID')
    }

    const scriptJobsCollection = client.db('neurobass').collection('scriptJobs')

    await scriptJobsCollection.deleteMany({projectId: request.projectId, scriptFileName: request.scriptFileName, status: 'completed'})
    await scriptJobsCollection.deleteMany({projectId: request.projectId, scriptFileName: request.scriptFileName, status: 'failed'})

    return {
        type: 'deleteCompletedScriptJobs'
    }
}

export default deleteCompletedScriptJobsHandler