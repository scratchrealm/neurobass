import { DeleteWorkspaceRequest, DeleteWorkspaceResponse } from "../../src/types/NeurobassRequest";
import { getMongoClient } from "../getMongoClient";
import getWorkspace from "../getWorkspace";
import { userCanDeleteWorkspace } from "../permissions";

const deleteWorkspaceHandler = async (request: DeleteWorkspaceRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<DeleteWorkspaceResponse> => {
    const {verifiedUserId} = o

    const client = await getMongoClient()

    const workspace = await getWorkspace(request.workspaceId, {useCache: false})
    if (!userCanDeleteWorkspace(workspace, verifiedUserId)) {
        throw new Error('User does not have permission to delete this workspace')
    }

    const projectsCollection = client.db('neurobass').collection('projects')
    projectsCollection.deleteMany({workspaceId: request.workspaceId})

    const projectFilesCollection = client.db('neurobass').collection('projectFiles')
    projectFilesCollection.deleteMany({workspaceId: request.workspaceId})

    const scriptJobsCollection = client.db('neurobass').collection('scriptJobs')
    scriptJobsCollection.deleteMany({workspaceId: request.workspaceId})

    const dataBlobsCollection = client.db('neurobass').collection('dataBlobs')
    dataBlobsCollection.deleteMany({workspaceId: request.workspaceId})

    const workspacesCollection = client.db('neurobass').collection('workspaces')
    await workspacesCollection.deleteOne({workspaceId: request.workspaceId})

    return {
        type: 'deleteWorkspace'
    }
}

export default deleteWorkspaceHandler