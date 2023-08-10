import { DuplicateProjectFileRequest, DuplicateProjectFileResponse } from "../../src/types/NeurobassRequest";
import { getMongoClient } from "../getMongoClient";
import getProject from '../getProject';
import getWorkspace from '../getWorkspace';
import getWorkspaceRole from "../getWorkspaceRole";
import removeIdField from "../removeIdField";

const duplicateProjectFileHandler = async (request: DuplicateProjectFileRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<DuplicateProjectFileResponse> => {
    const {verifiedUserId} = o

    const projectId = request.projectId

    const client = await getMongoClient()

    const project = await getProject(projectId, {useCache: false})
    if (project.workspaceId !== request.workspaceId) {
        throw new Error('Incorrect workspace ID')
    }

    const workspace = await getWorkspace(project.workspaceId, {useCache: true})
    const workspaceRole = getWorkspaceRole(workspace, verifiedUserId)
    const canEdit = workspaceRole === 'admin' || workspaceRole === 'editor'
    if (!canEdit) {
        throw new Error('User does not have permission to duplicate a project file in this workspace')
    }

    const projectFilesCollection = client.db('neurobass').collection('projectFiles')

    const projectFile = removeIdField(await projectFilesCollection.findOne({
        projectId,
        fileName: request.fileName
    }))
    if (!projectFile) {
        throw new Error('Project file does not exist')
    }

    const existingProjectFile = await projectFilesCollection.findOne({
        projectId,
        fileName: request.newFileName
    })
    if (existingProjectFile) {
        throw new Error('Project file already exists')
    }

    await projectFilesCollection.insertOne({
        ...projectFile,
        fileName: request.newFileName,
        timestampModified: Date.now() / 1000
    })
    
    return {
        type: 'duplicateProjectFile'
    }
}

export default duplicateProjectFileHandler