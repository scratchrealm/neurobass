import { DeleteFileRequest, DeleteFileResponse } from "../../src/types/NeurobassRequest";
import getProject from '../getProject';
import { getMongoClient } from "../getMongoClient";
import getWorkspace from '../getWorkspace';
import { userCanDeleteFile } from "../permissions";
import removeIdField from "../removeIdField";
import { isNBDataBlob, isNBFile, isNBJob, NBDataBlob, NBFile, NBJob } from "../../src/types/neurobass-types";

const deleteFileHandler = async (request: DeleteFileRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<DeleteFileResponse> => {
    const {verifiedUserId, verifiedClientId} = o

    const projectId = request.projectId

    const client = await getMongoClient()

    const project = await getProject(projectId, {useCache: false})
    if (project.workspaceId !== request.workspaceId) {
        throw new Error('Incorrect workspace ID')
    }

    const workspace = await getWorkspace(project.workspaceId, {useCache: true})
    if (!userCanDeleteFile(workspace, verifiedUserId, verifiedClientId)) {
        throw new Error('User does not have permission to delete files in this workspace')
    }

    const filesCollection = client.db('neurobass').collection('files')

    const file = await filesCollection.findOne({
        projectId,
        fileName: request.fileName
    })
    if (!file) {
        throw new Error('Project file does not exist')
    }

    await filesCollection.deleteOne({
        projectId,
        fileName: request.fileName
    })

    const projectsCollection = client.db('neurobass').collection('projects')
    await projectsCollection.updateOne({projectId: request.projectId}, {$set: {timestampModified: Date.now() / 1000}})

    const workspacesCollection = client.db('neurobass').collection('workspaces')
    await workspacesCollection.updateOne({workspaceId: request.workspaceId}, {$set: {timestampModified: Date.now() / 1000}})

    await cleanupProject(projectId)
    
    return {
        type: 'deleteFile'
    }
}

export const cleanupProject = async (projectId: string) => {
    const client = await getMongoClient()

    const filesCollection = client.db('neurobass').collection('files')
    const jobsCollection = client.db('neurobass').collection('jobs')
    const dataBlobsCollection = client.db('neurobass').collection('dataBlobs')

    let files = removeIdField(await filesCollection.find({projectId}).toArray()) as NBFile[]
    files.forEach(file => {
        if (!isNBFile(file)) {
            console.warn(file)
            throw new Error('Invalid file in database')
        }
    })
    let jobs = removeIdField(await jobsCollection.find({projectId}).toArray()) as NBJob[]
    jobs.forEach(job => {
        if (!isNBJob(job)) {
            console.warn(job)
            throw new Error('Invalid job in database')
        }
    })
    let dataBlobs = removeIdField(await dataBlobsCollection.find({projectId}).toArray()) as NBDataBlob[]
    dataBlobs.forEach(dataBlob => {
        if (!isNBDataBlob(dataBlob)) {
            console.warn(dataBlob)
            throw new Error('Invalid data blob in database')
        }
    })

    let somethingChanged = true
    while (somethingChanged) {
        const fileIds = new Set(files.map(x => x.fileId))
        const jobIds = new Set(jobs.map(x => x.jobId))
        const dataBlobIds = new Set(dataBlobs.map(x => x.sha1))

        const jobIdsToDelete = new Set<string>()
        jobs.forEach(job => {
            if (job.inputFileIds.some(x => !fileIds.has(x))) {
                // some input file no longer exists
                jobIdsToDelete.add(job.jobId)
            }
            if (job.outputFileIds) {
                if (job.outputFileIds.some(x => !fileIds.has(x))) {
                    // some output file no longer exists
                    jobIdsToDelete.add(job.jobId)
                }
            }
        })
        const fileIdsToDelete = new Set<string>()
        files.forEach(file => {
            if (file.jobId) {
                if ((!jobIds.has(file.jobId)) || (jobIdsToDelete.has(file.jobId))) {
                    // job no longer exists
                    fileIdsToDelete.add(file.fileId)
                }
                if (file.content.startsWith('blob:')) {
                    if (!dataBlobIds.has(file.content.slice('blob:'.length))) {
                        // data blob no longer exists
                        fileIdsToDelete.add(file.fileId)
                    }
                }
            }
        })
        const dataBlobIdsToDelete = new Set<string>()
        dataBlobs.forEach(dataBlob => {
            let found = false
            files.forEach(file => {
                if (!fileIdsToDelete.has(file.fileId)) {
                    if (file.content === `blob:${dataBlob.sha1}`) {
                        found = true
                    }
                }
            })
            if (!found) {
                dataBlobIdsToDelete.add(dataBlob.sha1)
            }
        })
        somethingChanged = false
        if (jobIdsToDelete.size > 0) {
            somethingChanged = true
            await jobsCollection.deleteMany({
                jobId: {$in: Array.from(jobIdsToDelete)}
            })
            jobs = jobs.filter(x => !jobIdsToDelete.has(x.jobId))
        }
        if (fileIdsToDelete.size > 0) {
            somethingChanged = true
            await filesCollection.deleteMany({
                fileId: {$in: Array.from(fileIdsToDelete)}
            })
            files = files.filter(x => !fileIdsToDelete.has(x.fileId))
        }
        if (dataBlobIdsToDelete.size > 0) {
            somethingChanged = true
            await dataBlobsCollection.deleteMany({
                sha1: {$in: Array.from(dataBlobIdsToDelete)}
            })
            dataBlobs = dataBlobs.filter(x => !dataBlobIdsToDelete.has(x.sha1))
        }
    }
}

export default deleteFileHandler