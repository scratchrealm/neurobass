import { isNBFile } from "../../src/types/neurobass-types";
import { RenameFileRequest, RenameFileResponse } from "../../src/types/NeurobassRequest";
import { getMongoClient } from "../getMongoClient";
import getProject from '../getProject';
import getWorkspace from '../getWorkspace';
import getWorkspaceRole from "../getWorkspaceRole";
import removeIdField from "../removeIdField";

const renameFileHandler = async (request: RenameFileRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<RenameFileResponse> => {
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

    const filesCollection = client.db('neurobass').collection('files')

    const file = removeIdField(await filesCollection.findOne({
        projectId,
        fileName: request.fileName
    }))
    if (!file) {
        throw new Error('Project file does not exist')
    }
    if (!isNBFile(file)) {
        console.warn(file)
        throw new Error('Invalid file in database')
    }
    if (file.jobId) {
        throw Error('Cannot rename a file that is the output of a job.')
    }

    const existingFile = await filesCollection.findOne({
        projectId,
        fileName: request.newFileName
    })
    if (existingFile) {
        throw new Error('Project file already exists')
    }

    await filesCollection.updateOne({
        projectId,
        fileName: request.fileName
    }, {
        $set: {
            fileName: request.newFileName
        }
    })
    
    return {
        type: 'renameFile'
    }
}

export default renameFileHandler