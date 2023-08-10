import { RenameProjectFileRequest, RenameProjectFileResponse } from "../../src/types/NeurobassRequest";
import { getMongoClient } from "../getMongoClient";
import getProject from '../getProject';
import getWorkspace from '../getWorkspace';
import getWorkspaceRole from "../getWorkspaceRole";
import removeIdField from "../removeIdField";

const renameProjectFileHandler = async (request: RenameProjectFileRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<RenameProjectFileResponse> => {
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
        throw new Error('User does not have permission to rename a project file in this workspace')
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

    await projectFilesCollection.updateOne({
        projectId,
        fileName: request.fileName
    }, {
        $set: {
            fileName: request.newFileName
        }
    })
    
    return {
        type: 'renameProjectFile'
    }
}

export default renameProjectFileHandler