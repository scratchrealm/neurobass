import { CreateProjectRequest, CreateJobRequest, CreateWorkspaceRequest, DeleteFileRequest, DeleteProjectRequest, DeleteComputeResourceRequest, DeleteJobRequest, DeleteWorkspaceRequest, GetProjectsRequest, GetFileRequest, GetFilesRequest, GetProjectRequest, GetComputeResourcesRequest, GetDataBlobRequest, GetJobRequest, GetJobsRequest, GetWorkspaceRequest, GetWorkspacesRequest, RegisterComputeResourceRequest, SetFileRequest, SetProjectPropertyRequest, SetWorkspacePropertyRequest, SetWorkspaceUsersRequest, DuplicateFileRequest, RenameFileRequest, GetComputeResourceRequest, GetComputeResourceSpecRequest } from "../types/NeurobassRequest";
import { NBProject, NBFile, NBComputeResource, NBJob, NBWorkspace } from "../types/neurobass-types";
import postNeurobassRequest from "./postNeurobassRequest";

export const fetchWorkspaces = async (auth: Auth): Promise<NBWorkspace[]> => {
    const req: GetWorkspacesRequest = {
        type: 'getWorkspaces',
        timestamp: Date.now() / 1000
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getWorkspaces') {
        throw Error(`Unexpected response type ${resp.type}. Expected getWorkspaces.`)
    }
    return resp.workspaces
}

export const fetchWorkspace = async (workspaceId: string, auth: Auth): Promise<NBWorkspace | undefined> => {
    const req: GetWorkspaceRequest = {
        type: 'getWorkspace',
        timestamp: Date.now() / 1000,
        workspaceId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getWorkspace') {
        throw Error(`Unexpected response type ${resp.type}. Expected getWorkspace.`)
    }
    return resp.workspace
}

type Auth = {
    githubAccessToken?: string
}

export const createWorkspace = async (workspaceName: string, auth: Auth): Promise<string> => {
    const req: CreateWorkspaceRequest = {
        type: 'createWorkspace',
        timestamp: Date.now() / 1000,
        name: workspaceName
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'createWorkspace') {
        throw Error(`Unexpected response type ${resp.type}. Expected createWorkspace.`)
    }
    return resp.workspaceId
}

export const fetchProjects = async (workspaceId: string, auth: Auth): Promise<NBProject[]> => {
    const req: GetProjectsRequest = {
        type: 'getProjects',
        timestamp: Date.now() / 1000,
        workspaceId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getProjects') {
        throw Error(`Unexpected response type ${resp.type}. Expected getProjects.`)
    }
    return resp.projects
}

export const createProject = async (workspaceId: string, projectName: string, auth: Auth): Promise<string> => {
    const req: CreateProjectRequest = {
        type: 'createProject',
        timestamp: Date.now() / 1000,
        workspaceId,
        name: projectName
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'createProject') {
        throw Error(`Unexpected response type ${resp.type}. Expected createProject.`)
    }
    return resp.projectId
}

export const setWorkspaceUsers = async (workspaceId: string, users: {userId: string, role: 'admin' | 'editor' | 'viewer'}[], auth: Auth): Promise<void> => {
    const req: SetWorkspaceUsersRequest = {
        type: 'setWorkspaceUsers',
        timestamp: Date.now() / 1000,
        workspaceId,
        users
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'setWorkspaceUsers') {
        throw Error(`Unexpected response type ${resp.type}. Expected setWorkspaceUsers.`)
    }
}

export const setWorkspaceProperty = async (workspaceId: string, property: 'name' | 'publiclyReadable' | 'listed' | 'computeResourceId', value: any, auth: Auth): Promise<void> => {
    const req: SetWorkspacePropertyRequest = {
        type: 'setWorkspaceProperty',
        timestamp: Date.now() / 1000,
        workspaceId,
        property,
        value
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'setWorkspaceProperty') {
        throw Error(`Unexpected response type ${resp.type}. Expected setWorkspaceProperty.`)
    }
}


export const deleteWorkspace = async (workspaceId: string, auth: Auth): Promise<void> => {
    const req: DeleteWorkspaceRequest = {
        type: 'deleteWorkspace',
        timestamp: Date.now() / 1000,
        workspaceId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'deleteWorkspace') {
        throw Error(`Unexpected response type ${resp.type}. Expected deleteWorkspace.`)
    }
}

export const fetchProject = async (projectId: string, auth: Auth): Promise<NBProject | undefined> => {
    const req: GetProjectRequest = {
        type: 'getProject',
        timestamp: Date.now() / 1000,
        projectId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getProject') {
        throw Error(`Unexpected response type ${resp.type}. Expected getProject.`)
    }
    return resp.project
}

export const fetchFiles = async (projectId: string, auth: Auth): Promise<NBFile[]> => {
    const req: GetFilesRequest = {
        type: 'getFiles',
        timestamp: Date.now() / 1000,
        projectId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getFiles') {
        throw Error(`Unexpected response type ${resp.type}. Expected getFiles.`)
    }
    return resp.files
}

export const fetchFile = async (projectId: string, fileName: string, auth: Auth): Promise<NBFile | undefined> => {
    const req: GetFileRequest = {
        type: 'getFile',
        timestamp: Date.now() / 1000,
        projectId,
        fileName
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getFile') {
        throw Error(`Unexpected response type ${resp.type}. Expected getFile.`)
    }
    return resp.file
}

export const fetchFileText = async (file: NBFile, auth: Auth): Promise<string | undefined> => {
    if (file.content.startsWith('blob:')) {
        const sha1 = file.content.slice('blob:'.length)
        const txt = await fetchDataBlob(file.workspaceId, file.projectId, sha1, {})
        return txt
    }
    else if (file.content.startsWith('data:')) {
        const txt = file.content.slice('data:'.length)
        return txt
    }
    else {
        throw Error(`Unable to fetch file text for file ${file.fileName}`)
    }
}


export const fetchDataBlob = async (workspaceId: string, projectId: string, sha1: string, auth: Auth): Promise<string | undefined> => {
    const req: GetDataBlobRequest = {
        type: 'getDataBlob',
        timestamp: Date.now() / 1000,
        workspaceId,
        projectId,
        sha1
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getDataBlob') {
        throw Error(`Unexpected response type ${resp.type}. Expected getDataBlob.`)
    }
    return resp.content
}

export const setFileText = async (workspaceId: string, projectId: string, fileName: string, fileContent: string, auth: Auth): Promise<void> => {
    const req: SetFileRequest = {
        type: 'setFile',
        timestamp: Date.now() / 1000,
        projectId,
        workspaceId,
        fileName,
        fileData: fileContent,
        size: fileContent.length,
        metadata: {}
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'setFile') {
        throw Error(`Unexpected response type ${resp.type}. Expected setFile.`)
    }
}

export const headRequest = async (url: string) => {
    // Cannot use HEAD, because it is not allowed by CORS on DANDI AWS bucket
    // let headResponse
    // try {
    //     headResponse = await fetch(url, {method: 'HEAD'})
    //     if (headResponse.status !== 200) {
    //         return undefined
    //     }
    // }
    // catch(err: any) {
    //     console.warn(`Unable to HEAD ${url}: ${err.message}`)
    //     return undefined
    // }
    // return headResponse

    // Instead, use aborted GET.
    const controller = new AbortController();
    const signal = controller.signal;
    const response = await fetch(url, { signal })
    controller.abort();
    return response
}

const getSizeForRemoteFile = async (url: string): Promise<number> => {
    const response = await headRequest(url)
    if (!response) {
        throw Error(`Unable to HEAD ${url}`)
    }
    const size = Number(response.headers.get('content-length'))
    if (isNaN(size)) {
        throw Error(`Unable to get content-length for ${url}`)
    }
    return size
}

export const setUrlFile = async (workspaceId: string, projectId: string, fileName: string, url: string, metadata: any, auth: Auth): Promise<void> => {
    const size = await getSizeForRemoteFile(url)
    const req: SetFileRequest = {
        type: 'setFile',
        timestamp: Date.now() / 1000,
        projectId,
        workspaceId,
        fileName,
        content: `url:${url}`,
        size,
        metadata
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'setFile') {
        throw Error(`Unexpected response type ${resp.type}. Expected setFile.`)
    }
}

export const deleteFile = async (workspaceId: string, projectId: string, fileName: string, auth: Auth): Promise<void> => {
    const req: DeleteFileRequest = {
        type: 'deleteFile',
        timestamp: Date.now() / 1000,
        projectId,
        workspaceId,
        fileName
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'deleteFile') {
        throw Error(`Unexpected response type ${resp.type}. Expected deleteFile.`)
    }
}

export const duplicateFile = async (workspaceId: string, projectId: string, fileName: string, newFileName: string, auth: Auth): Promise<void> => {
    const req: DuplicateFileRequest = {
        type: 'duplicateFile',
        timestamp: Date.now() / 1000,
        projectId,
        workspaceId,
        fileName,
        newFileName
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'duplicateFile') {
        throw Error(`Unexpected response type ${resp.type}. Expected duplicateFile.`)
    }
}

export const renameFile = async (workspaceId: string, projectId: string, fileName: string, newFileName: string, auth: Auth): Promise<void> => {
    const req: RenameFileRequest = {
        type: 'renameFile',
        timestamp: Date.now() / 1000,
        projectId,
        workspaceId,
        fileName,
        newFileName
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'renameFile') {
        throw Error(`Unexpected response type ${resp.type}. Expected renameFile.`)
    }
}

export const deleteProject = async (workspaceId: string, projectId: string, auth: Auth): Promise<void> => {
    const req: DeleteProjectRequest = {
        type: 'deleteProject',
        timestamp: Date.now() / 1000,
        workspaceId,
        projectId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'deleteProject') {
        throw Error(`Unexpected response type ${resp.type}. Expected deleteProject.`)
    }
}

export const setProjectProperty = async (projectId: string, property: 'name', value: any, auth: Auth): Promise<void> => {
    const req: SetProjectPropertyRequest = {
        type: 'setProjectProperty',
        timestamp: Date.now() / 1000,
        projectId,
        property,
        value
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'setProjectProperty') {
        throw Error(`Unexpected response type ${resp.type}. Expected setProjectProperty.`)
    }
}

export const fetchComputeResources = async (auth: Auth): Promise<NBComputeResource[]> => {
    const req: GetComputeResourcesRequest = {
        type: 'getComputeResources',
        timestamp: Date.now() / 1000
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getComputeResources') {
        throw Error(`Unexpected response type ${resp.type}. Expected getComputeResources.`)
    }
    return resp.computeResources
}

export const fetchComputeResource = async (computeResourceId: string, auth: Auth): Promise<NBComputeResource | undefined> => {
    const req: GetComputeResourceRequest = {
        type: 'getComputeResource',
        timestamp: Date.now() / 1000,
        computeResourceId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getComputeResource') {
        throw Error(`Unexpected response type ${resp.type}. Expected getComputeResource.`)
    }
    return resp.computeResource
}

export const registerComputeResource = async (computeResourceId: string, resourceCode: string, name: string, auth: Auth): Promise<void> => {
    const req: RegisterComputeResourceRequest = {
        type: 'registerComputeResource',
        timestamp: Date.now() / 1000,
        computeResourceId,
        resourceCode,
        name
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'registerComputeResource') {
        throw Error(`Unexpected response type ${resp.type}. Expected registerComputeResource.`)
    }
}

export const deleteComputeResource = async (computeResourceId: string, auth: Auth): Promise<void> => {
    const req: DeleteComputeResourceRequest = {
        type: 'deleteComputeResource',
        timestamp: Date.now() / 1000,
        computeResourceId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'deleteComputeResource') {
        throw Error(`Unexpected response type ${resp.type}. Expected deleteComputeResource.`)
    }
}

export const createJob = async (
    workspaceId: string,
    projectId: string,
    o: {
        toolName: string,
        inputFiles: {
            name: string
            fileName: string
        }[],
        inputParameters: {
            name: string
            value: any
        }[],
        outputFiles: {
            name: string
            fileName: string
        }[]
    },
    auth: Auth)
: Promise<string> => {
    const req: CreateJobRequest = {
        type: 'createJob',
        timestamp: Date.now() / 1000,
        workspaceId,
        projectId,
        toolName: o.toolName,
        inputFiles: o.inputFiles,
        inputParameters: o.inputParameters,
        outputFiles: o.outputFiles
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'createJob') {
        throw Error(`Unexpected response type ${resp.type}. Expected createJob.`)
    }
    return resp.jobId
}

export const deleteJob = async (workspaceId: string, projectId: string, jobId: string, auth: Auth): Promise<void> => {
    const req: DeleteJobRequest = {
        type: 'deleteJob',
        timestamp: Date.now() / 1000,
        workspaceId,
        projectId,
        jobId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'deleteJob') {
        throw Error(`Unexpected response type ${resp.type}. Expected deleteJob.`)
    }
}

export const fetchJobsForProject = async (projectId: string, auth: Auth): Promise<NBJob[]> => {
    const req: GetJobsRequest = {
        type: 'getJobs',
        timestamp: Date.now() / 1000,
        projectId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getJobs') {
        throw Error(`Unexpected response type ${resp.type}. Expected getJobs.`)
    }
    return resp.jobs
}

export const fetchJobsForComputeResource = async (computeResourceId: string, auth: Auth): Promise<NBJob[]> => {
    const req: GetJobsRequest = {
        type: 'getJobs',
        timestamp: Date.now() / 1000,
        computeResourceId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getJobs') {
        throw Error(`Unexpected response type ${resp.type}. Expected getJobs.`)
    }
    return resp.jobs
}

export const fetchJob = async (workspaceId: string, projectId: string, jobId: string, auth: Auth): Promise<NBJob | undefined> => {
    const req: GetJobRequest = {
        type: 'getJob',
        timestamp: Date.now() / 1000,
        workspaceId,
        projectId,
        jobId
    }
    const resp = await postNeurobassRequest(req, {...auth})
    if (resp.type !== 'getJob') {
        throw Error(`Unexpected response type ${resp.type}. Expected getJob.`)
    }
    return resp.job
}

export const getComputeResourceSpec = async (computeResourceId: string): Promise<any> => {
    const req: GetComputeResourceSpecRequest = {
        type: 'getComputeResourceSpec',
        timestamp: Date.now() / 1000,
        computeResourceId
    }
    const resp = await postNeurobassRequest(req, {})
    if (resp.type !== 'getComputeResourceSpec') {
        throw Error(`Unexpected response type ${resp.type}. Expected getComputeResource.`)
    }
    return resp.spec
}