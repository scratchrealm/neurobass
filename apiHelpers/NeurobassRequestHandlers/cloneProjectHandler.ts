import { CloneProjectRequest, CloneProjectResponse } from "../../src/types/NeurobassRequest";
import getProject from "../getProject";
import { getMongoClient } from "../getMongoClient";
import getWorkspace from "../getWorkspace";
import getWorkspaceRole from '../getWorkspaceRole';
import createRandomId from "../createRandomId";
import { SPDataBlob, SPProject, SPProjectFile } from "../../src/types/neurobass-types";
import removeIdField from "../removeIdField";

const cloneProjectHandler = async (request: CloneProjectRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<CloneProjectResponse> => {
    const {verifiedUserId} = o

    const client = await getMongoClient()

    const workspace = await getWorkspace(request.workspaceId, {useCache: false})
    const workspaceRole = getWorkspaceRole(workspace, verifiedUserId)
    const canView = workspaceRole === 'admin' || workspaceRole === 'editor' || workspaceRole === 'viewer'
    if (!canView) {
        throw new Error('User does not have permission to clone an projects in this workspace')
    }
    const workspace2 = await getWorkspace(request.newWorkspaceId, {useCache: false})
    const workspaceRole2 = getWorkspaceRole(workspace2, verifiedUserId)
    const canEdit2 = workspaceRole2 === 'admin' || workspaceRole2 === 'editor'
    if (!canEdit2) {
        throw new Error('User does not have permission to create new projects in this workspace')
    }

    const project = await getProject(request.projectId, {useCache: false})
    if (project.workspaceId !== request.workspaceId) {
        throw new Error('Incorrect workspace ID')
    }

    // create the new project
    const project2: SPProject = {
        ...project,
        projectId: createRandomId(8),
        workspaceId: request.newWorkspaceId,
        name: request.workspaceId !== request.newWorkspaceId ? project.name : `${project.name} (copy)`,
        timestampCreated: Date.now() / 1000,
        timestampModified: Date.now() / 1000
    }
    const projectsCollection = client.db('neurobass').collection('projects')
    await projectsCollection.insertOne(project2)

    // copy the files
    const projectFilesCollection = client.db('neurobass').collection('projectFiles')
    const projectFiles = removeIdField(await projectFilesCollection.find({projectId: request.projectId}).toArray()) as SPProjectFile[]
    await projectFilesCollection.insertMany(projectFiles.map(projectFile => ({
        ...projectFile,
        workspaceId: project2.workspaceId,
        projectId: project2.projectId
    })))

    // copy the data blobs
    const dataBlobsCollection = client.db('neurobass').collection('dataBlobs')
    const dataBlobs = removeIdField(await dataBlobsCollection.find({projectId: request.projectId}).toArray()) as SPDataBlob[]
    await dataBlobsCollection.insertMany(dataBlobs.map(dataBlob => ({
        ...dataBlob,
        workspaceId: project2.workspaceId,
        projectId: project2.projectId
    })))

    const workspacesCollection = client.db('neurobass').collection('workspaces')
    await workspacesCollection.updateOne({workspaceId: request.newWorkspaceId}, {$set: {timestampModified: Date.now() / 1000}})

    return {
        type: 'cloneProject',
        newProjectId: project2.projectId
    }
}

export default cloneProjectHandler