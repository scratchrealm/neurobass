import crypto from 'crypto';
import { SetFileRequest, SetFileResponse } from "../../src/types/NeurobassRequest";
import { NBFile } from "../../src/types/neurobass-types";
import getProject from '../getProject';
import { getMongoClient } from "../getMongoClient";
import getWorkspace from '../getWorkspace';
import { userCanSetFile } from '../permissions';
import { cleanupProject } from './deleteFileHandler';
import createRandomId from '../createRandomId';

const setFileHandler = async (request: SetFileRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<SetFileResponse> => {
    const {verifiedUserId, verifiedClientId} = o

    const projectId = request.projectId

    const client = await getMongoClient()

    const project = await getProject(projectId, {useCache: false})
    if (project.workspaceId !== request.workspaceId) {
        throw new Error('Incorrect workspace ID')
    }

    const workspaceId = project.workspaceId

    const workspace = await getWorkspace(project.workspaceId, {useCache: true})
    if (!userCanSetFile(workspace, verifiedUserId, verifiedClientId)) {
        throw new Error('User does not have permission to set an project file in this workspace')
    }

    let content: string | undefined = undefined
    if (request.fileData != undefined) {
        if (request.content) {
            throw Error('Cannot specify both fileData and content')
        }
        if (request.fileData.length !== request.size) {
            throw Error('fileData.length does not match size')
        }
        const dataBlobsCollection = client.db('neurobass').collection('dataBlobs')
        const contentSha1 = sha1OfString(request.fileData)
        const contentSize = request.fileData.length
        const dataBlob = await dataBlobsCollection.findOne({
            workspaceId,
            projectId,
            sha1: contentSha1
        })
        if (!dataBlob) {
            await dataBlobsCollection.insertOne({
                workspaceId,
                projectId,
                sha1: contentSha1,
                size: contentSize,
                content: request.fileData
            })
        }
        content = `blob:${contentSha1}`
    }
    else {
        if (!request.content) {
            throw Error('Must specify either fileData or content')
        }
        if (request.content.startsWith('blob:')) {
            throw Error('Cannot specify content that starts with blob:')
        }
        content = request.content
    }

    const filesCollection = client.db('neurobass').collection('files')

    const file = await filesCollection.findOne({
        projectId,
        fileName: request.fileName
    })
    let deletedOldFile = false
    if (file) {
        deletedOldFile = true
        await filesCollection.deleteOne({
            projectId,
            fileName: request.fileName
        })
    }
    const newFile: NBFile = {
        projectId,
        workspaceId,
        fileId: createRandomId(8),
        userId: verifiedUserId || '',
        fileName: request.fileName,
        size: request.size,
        timestampCreated: Date.now() / 1000,
        content,
        metadata: request.metadata
    }
    if (request.jobId) {
        newFile.jobId = request.jobId
    }
    await filesCollection.insertOne(newFile)

    if (deletedOldFile) {
        await cleanupProject(projectId)
    }

    const projectsCollection = client.db('neurobass').collection('projects')
    await projectsCollection.updateOne({projectId}, {$set: {timestampModified: Date.now() / 1000}})

    const workspacesCollection = client.db('neurobass').collection('workspaces')
    await workspacesCollection.updateOne({workspaceId}, {$set: {timestampModified: Date.now() / 1000}})

    return {
        type: 'setFile'
    }
}

const sha1OfString = (s: string): string => {
    const hash = crypto.createHash('sha1')
    hash.update(s)
    return hash.digest('hex')
}

export default setFileHandler