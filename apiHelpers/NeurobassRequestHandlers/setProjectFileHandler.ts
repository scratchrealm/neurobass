import crypto from 'crypto';
import { SetProjectFileRequest, SetProjectFileResponse } from "../../src/types/NeurobassRequest";
import { SPProjectFile } from "../../src/types/neurobass-types";
import getProject from '../getProject';
import { getMongoClient } from "../getMongoClient";
import getWorkspace from '../getWorkspace';
import { userCanSetProjectFile } from '../permissions';

const setProjectFileHandler = async (request: SetProjectFileRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<SetProjectFileResponse> => {
    const {verifiedUserId, verifiedClientId} = o

    const projectId = request.projectId

    const client = await getMongoClient()

    const project = await getProject(projectId, {useCache: false})
    if (project.workspaceId !== request.workspaceId) {
        throw new Error('Incorrect workspace ID')
    }

    const workspaceId = project.workspaceId

    const workspace = await getWorkspace(project.workspaceId, {useCache: true})
    if (!userCanSetProjectFile(workspace, verifiedUserId, verifiedClientId)) {
        throw new Error('User does not have permission to set an project file in this workspace')
    }

    const dataBlobsCollection = client.db('neurobass').collection('dataBlobs')
    const contentSha1 = sha1OfString(request.fileContent)
    const contentSize = request.fileContent.length
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
            content: request.fileContent
        })
    }

    const projectFilesCollection = client.db('neurobass').collection('projectFiles')

    const projectFile = await projectFilesCollection.findOne({
        projectId,
        fileName: request.fileName
    })
    if (!projectFile) {
        const newProjectFile: SPProjectFile = {
            projectId,
            workspaceId,
            fileName: request.fileName,
            contentSha1,
            contentSize,
            timestampModified: Date.now() / 1000
        }
        await projectFilesCollection.insertOne(newProjectFile)
    }
    else {
        await projectFilesCollection.updateOne({
            projectId,
            fileName: request.fileName
        }, {
            $set: {
                contentSha1,
                contentSize,
                timestampModified: Date.now() / 1000
            }
        })
    }

    const projectsCollection = client.db('neurobass').collection('projects')
    await projectsCollection.updateOne({projectId}, {$set: {timestampModified: Date.now() / 1000}})

    const workspacesCollection = client.db('neurobass').collection('workspaces')
    await workspacesCollection.updateOne({workspaceId}, {$set: {timestampModified: Date.now() / 1000}})

    // remove data blobs that are no longer referenced
    const contentSha1s = await projectFilesCollection.distinct('contentSha1', {projectId})
    await dataBlobsCollection.deleteMany({
        projectId,
        sha1: {$nin: contentSha1s}
    })

    return {
        type: 'setProjectFile'
    }
}

const sha1OfString = (s: string): string => {
    const hash = crypto.createHash('sha1')
    hash.update(s)
    return hash.digest('hex')
}

export default setProjectFileHandler