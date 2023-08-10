import { SetWorkspacePropertyRequest, SetWorkspacePropertyResponse } from "../../src/types/NeurobassRequest";
import { getMongoClient } from "../getMongoClient";
import getWorkspace, { invalidateWorkspaceCache } from "../getWorkspace";
import { userCanSetWorkspaceProperty } from "../permissions";

const setWorkspacePropertyHandler = async (request: SetWorkspacePropertyRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<SetWorkspacePropertyResponse> => {
    const {verifiedUserId} = o

    const workspaceId = request.workspaceId

    const client = await getMongoClient()

    const workspace = await getWorkspace(request.workspaceId, {useCache: false})
    if (!userCanSetWorkspaceProperty(workspace, verifiedUserId)) {
        throw new Error(`User ${verifiedUserId} does not have permission to set workspace properties (owner: ${workspace.ownerId})`)
    }

    if (request.property === 'name') {
        workspace.name = request.value
    }
    else if (request.property === 'publiclyReadable') {
        workspace.publiclyReadable = request.value
    }
    else if (request.property === 'listed') {
        workspace.listed = request.value
    }
    else if (request.property === 'computeResourceId') {
        workspace.computeResourceId = request.value
    }
    else {
        throw new Error('Invalid property')
    }

    workspace.timestampModified = Date.now() / 1000

    const workspacesCollection = client.db('neurobass').collection('workspaces')

    await workspacesCollection.updateOne({workspaceId}, {$set: workspace})

    invalidateWorkspaceCache(workspaceId)

    return {
        type: 'setWorkspaceProperty'
    }
}

export default setWorkspacePropertyHandler