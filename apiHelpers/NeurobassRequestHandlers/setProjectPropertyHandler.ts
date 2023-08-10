import { SetProjectPropertyRequest, SetProjectPropertyResponse } from "../../src/types/NeurobassRequest";
import getProject, { invalidateProjectCache } from '../getProject';
import { getMongoClient } from "../getMongoClient";
import getWorkspace from '../getWorkspace';
import { userCanSetProjectProperty } from "../permissions";

const setProjectPropertyHandler = async (request: SetProjectPropertyRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<SetProjectPropertyResponse> => {
    const {verifiedUserId} = o

    const projectId = request.projectId

    const client = await getMongoClient()

    const project = await getProject(projectId, {useCache: false})

    const workspace = await getWorkspace(project.workspaceId, {useCache: true})
    if (!userCanSetProjectProperty(workspace, verifiedUserId, request.property)) {
        throw new Error('User does not have permission to set an project property in this workspace')
    }

    if (request.property === 'name') {
        project.name = request.value
    }
    else {
        throw new Error('Invalid property')
    }

    project.timestampModified = Date.now() / 1000

    const projectsCollection = client.db('neurobass').collection('projects')
    await projectsCollection.updateOne({projectId}, {$set: project})

    invalidateProjectCache(projectId)

    return {
        type: 'setProjectProperty'
    }
}

export default setProjectPropertyHandler