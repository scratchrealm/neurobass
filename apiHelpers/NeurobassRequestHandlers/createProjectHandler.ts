import { CreateProjectRequest, CreateProjectResponse } from "../../src/types/NeurobassRequest";
import { SPProject } from "../../src/types/neurobass-types";
import createRandomId from "../createRandomId";
import { getMongoClient } from "../getMongoClient";
import getWorkspace from "../getWorkspace";
import { userCanCreateProject } from "../permissions";

const createProjectHandler = async (request: CreateProjectRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<CreateProjectResponse> => {
    const {verifiedUserId} = o

    const projectId = createRandomId(8)

    const workspaceId = request.workspaceId

    const client = await getMongoClient()

    const workspace = await getWorkspace(workspaceId, {useCache: false})

    if (!userCanCreateProject(workspace, verifiedUserId)) {
        throw new Error('User does not have permission to create an projects in this workspace')
    }

    const projects: SPProject = {
        projectId,
        workspaceId,
        name: request.name,
        description: '',
        timestampCreated: Date.now() / 1000,
        timestampModified: Date.now() / 1000
    }

    const projectsCollection = client.db('neurobass').collection('projects')

    await projectsCollection.insertOne(projects)

    const workspacesCollection = client.db('neurobass').collection('workspaces')
    await workspacesCollection.updateOne({workspaceId}, {$set: {timestampModified: Date.now() / 1000}})

    return {
        type: 'createProject',
        projectId
    }
}

export default createProjectHandler