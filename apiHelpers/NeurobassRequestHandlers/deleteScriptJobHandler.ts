import { DeleteScriptJobRequest, DeleteScriptJobResponse } from "../../src/types/NeurobassRequest";
import getProject from "../getProject";
import { getMongoClient } from "../getMongoClient";
import getWorkspace from "../getWorkspace";
import getWorkspaceRole from "../getWorkspaceRole";

const deleteScriptJobHandler = async (request: DeleteScriptJobRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<DeleteScriptJobResponse> => {
    const {verifiedUserId} = o

    const client = await getMongoClient()

    const workspace = await getWorkspace(request.workspaceId, {useCache: false})
    const workspaceRole = getWorkspaceRole(workspace, verifiedUserId)
    const okay = workspaceRole === 'admin' || workspaceRole === 'editor'
    if (!okay) {
        throw new Error('User does not have permission to delete a script job in this workspace')
    }

    const project = await getProject(request.projectId, {useCache: false})
    // important to check this
    if (project.workspaceId !== request.workspaceId) {
        throw new Error('Incorrect workspace ID')
    }

    const scriptJobsCollection = client.db('neurobass').collection('scriptJobs')
    await scriptJobsCollection.deleteOne({scriptJobId: request.scriptJobId})

    const projectsCollection = client.db('neurobass').collection('projects')
    await projectsCollection.updateOne({projectId: request.projectId}, {$set: {timestampModified: Date.now() / 1000}})

    const workspacesCollection = client.db('neurobass').collection('workspaces')
    await workspacesCollection.updateOne({workspaceId: request.workspaceId}, {$set: {timestampModified: Date.now() / 1000}})

    return {
        type: 'deleteScriptJob'
    }
}

export default deleteScriptJobHandler