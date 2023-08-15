import { DuplicateFileRequest, DuplicateFileResponse } from "../../src/types/NeurobassRequest";
import createRandomId from "../createRandomId";
import { getMongoClient } from "../getMongoClient";
import getProject from '../getProject';
import getWorkspace from '../getWorkspace';
import getWorkspaceRole from "../getWorkspaceRole";
import removeIdField from "../removeIdField";

const duplicateFileHandler = async (request: DuplicateFileRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<DuplicateFileResponse> => {
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

    const filesCollection = client.db('neurobass').collection('files')

    const file = removeIdField(await filesCollection.findOne({
        projectId,
        fileName: request.fileName
    }))
    if (!file) {
        throw new Error('Project file does not exist')
    }

    const existingFile = await filesCollection.findOne({
        projectId,
        fileName: request.newFileName
    })
    if (existingFile) {
        throw new Error('Project file already exists')
    }

    const newFile = {
        ...file,
        fileName: request.newFileName,
        fileId: createRandomId(8),
        jobId: undefined,
        timestampCreated: Date.now() / 1000
    }
    delete newFile.jobId // so that it doesn't get set to null
    await filesCollection.insertOne(newFile)
    
    return {
        type: 'duplicateFile'
    }
}

export default duplicateFileHandler