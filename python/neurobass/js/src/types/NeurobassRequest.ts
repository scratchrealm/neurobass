import { isNBProject, isNBFile, isNBComputeResource, isNBJob, isNBWorkspace, NBProject, NBFile, NBComputeResource, NBJob, NBWorkspace } from "./neurobass-types"
import validateObject, { isArrayOf, isBoolean, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

// getWorkspaces

export type GetWorkspacesRequest = {
    type: 'getWorkspaces'
    timestamp: number
}

export const isGetWorkspacesRequest = (x: any): x is GetWorkspacesRequest => {
    return validateObject(x, {
        type: isEqualTo('getWorkspaces'),
        timestamp: isNumber
    })
}

export type GetWorkspacesResponse = {
    type: 'getWorkspaces'
    workspaces: NBWorkspace[]
}

export const isGetWorkspacesResponse = (x: any): x is GetWorkspacesResponse => {
    return validateObject(x, {
        type: isEqualTo('getWorkspaces'),
        workspaces: isArrayOf(isNBWorkspace)
    })
}

// getWorkspace

export type GetWorkspaceRequest = {
    type: 'getWorkspace'
    timestamp: number
    workspaceId: string
}

export const isGetWorkspaceRequest = (x: any): x is GetWorkspaceRequest => {
    return validateObject(x, {
        type: isEqualTo('getWorkspace'),
        timestamp: isNumber,
        workspaceId: isString
    })
}

export type GetWorkspaceResponse = {
    type: 'getWorkspace'
    workspace: NBWorkspace
}

export const isGetWorkspaceResponse = (x: any): x is GetWorkspaceResponse => {
    return validateObject(x, {
        type: isEqualTo('getWorkspace'),
        workspace: isNBWorkspace
    })
}

// createWorkspace

export type CreateWorkspaceRequest = {
    type: 'createWorkspace'
    timestamp: number
    name: string
}

export const isCreateWorkspaceRequest = (x: any): x is CreateWorkspaceRequest => {
    return validateObject(x, {
        type: isEqualTo('createWorkspace'),
        timestamp: isNumber,
        name: isString
    })
}

export type CreateWorkspaceResponse = {
    type: 'createWorkspace'
    workspaceId: string
}

export const isCreateWorkspaceResponse = (x: any): x is CreateWorkspaceResponse => {
    return validateObject(x, {
        type: isEqualTo('createWorkspace'),
        workspaceId: isString
    })
}

// getProjects

export type GetProjectsRequest = {
    type: 'getProjects'
    timestamp: number
    workspaceId: string
}

export const isGetProjectsRequest = (x: any): x is GetProjectsRequest => {
    return validateObject(x, {
        type: isEqualTo('getProjects'),
        timestamp: isNumber,
        workspaceId: isString
    })
}

export type GetProjectsResponse = {
    type: 'getProjects'
    projects: NBProject[]
}

export const isGetProjectsResponse = (x: any): x is GetProjectsResponse => {
    return validateObject(x, {
        type: isEqualTo('getProjects'),
        projects: isArrayOf(isNBProject)
    })
}

// getProject

export type GetProjectRequest = {
    type: 'getProject'
    timestamp: number
    projectId: string
}

export const isGetProjectRequest = (x: any): x is GetProjectRequest => {
    return validateObject(x, {
        type: isEqualTo('getProject'),
        timestamp: isNumber,
        projectId: isString
    })
}

export type GetProjectResponse = {
    type: 'getProject'
    project: NBProject
}

export const isGetProjectResponse = (x: any): x is GetProjectResponse => {
    return validateObject(x, {
        type: isEqualTo('getProject'),
        project: isNBProject
    })
}

// createProject

export type CreateProjectRequest = {
    type: 'createProject'
    timestamp: number
    workspaceId: string
    name: string
}

export const isCreateProjectRequest = (x: any): x is CreateProjectRequest => {
    return validateObject(x, {
        type: isEqualTo('createProject'),
        timestamp: isNumber,
        workspaceId: isString,
        name: isString
    })
}

export type CreateProjectResponse = {
    type: 'createProject'
    projectId: string
}

export const isCreateProjectResponse = (x: any): x is CreateProjectResponse => {
    return validateObject(x, {
        type: isEqualTo('createProject'),
        projectId: isString,
    })
}

// deleteWorkspace

export type DeleteWorkspaceRequest = {
    type: 'deleteWorkspace'
    timestamp: number
    workspaceId: string
}

export const isDeleteWorkspaceRequest = (x: any): x is DeleteWorkspaceRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteWorkspace'),
        timestamp: isNumber,
        workspaceId: isString
    })
}

export type DeleteWorkspaceResponse = {
    type: 'deleteWorkspace'
}

export const isDeleteWorkspaceResponse = (x: any): x is DeleteWorkspaceResponse => {
    return validateObject(x, {
        type: isEqualTo('deleteWorkspace')
    })
}

// setWorkspaceUsers

export type SetWorkspaceUsersRequest = {
    type: 'setWorkspaceUsers'
    timestamp: number
    workspaceId: string
    users: {
        userId: string
        role: 'admin' | 'editor' | 'viewer'
    }[]
}

export const isSetWorkspaceUsersRequest = (x: any): x is SetWorkspaceUsersRequest => {
    return validateObject(x, {
        type: isEqualTo('setWorkspaceUsers'),
        timestamp: isNumber,
        workspaceId: isString,
        users: isArrayOf(y => (validateObject(y, {
            userId: isString,
            role: isOneOf([isEqualTo('admin'), isEqualTo('editor'), isEqualTo('viewer')])
        })))
    })
}

export type SetWorkspaceUsersResponse = {
    type: 'setWorkspaceUsers'
}

export const isSetWorkspaceUsersResponse = (x: any): x is SetWorkspaceUsersResponse => {
    return validateObject(x, {
        type: isEqualTo('setWorkspaceUsers')
    })
}

// setWorkspaceProperty

export type SetWorkspacePropertyRequest = {
    type: 'setWorkspaceProperty'
    timestamp: number
    workspaceId: string
    property: 'name' | 'publiclyReadable' | 'listed' | 'computeResourceId'
    value: any
}

export const isSetWorkspacePropertyRequest = (x: any): x is SetWorkspacePropertyRequest => {
    return validateObject(x, {
        type: isEqualTo('setWorkspaceProperty'),
        timestamp: isNumber,
        workspaceId: isString,
        property: isOneOf([isEqualTo('name'), isEqualTo('publiclyReadable'), isEqualTo('listed'), isEqualTo('computeResourceId')]),
        value: () => (true)
    })
}

export type SetWorkspacePropertyResponse = {
    type: 'setWorkspaceProperty'
}

export const isSetWorkspacePropertyResponse = (x: any): x is SetWorkspacePropertyResponse => {
    return validateObject(x, {
        type: isEqualTo('setWorkspaceProperty')
    })
}

// getFiles

export type GetFilesRequest = {
    type: 'getFiles'
    timestamp: number
    projectId: string
}

export const isGetFilesRequest = (x: any): x is GetFilesRequest => {
    return validateObject(x, {
        type: isEqualTo('getFiles'),
        timestamp: isNumber,
        projectId: isString
    })
}

export type GetFilesResponse = {
    type: 'getFiles'
    files: NBFile[]
}

export const isGetFilesResponse = (x: any): x is GetFilesResponse => {
    return validateObject(x, {
        type: isEqualTo('getFiles'),
        files: isArrayOf(isNBFile)
    })
}

// setFile

export type SetFileRequest = {
    type: 'setFile'
    timestamp: number
    projectId: string
    workspaceId: string
    fileName: string
    content?: string
    fileData?: string
    size: number
    jobId?: string
    metadata: {
        [key: string]: any
    }
}

export const isSetFileRequest = (x: any): x is SetFileRequest => {
    return validateObject(x, {
        type: isEqualTo('setFile'),
        timestamp: isNumber,
        projectId: isString,
        workspaceId: isString,
        fileName: isString,
        content: optional(isString),
        fileData: optional(isString),
        size: isNumber,
        jobId: optional(isString),
        metadata: () => (true)
    })
}

export type SetFileResponse = {
    type: 'setFile'
}

export const isSetFileResponse = (x: any): x is SetFileResponse => {
    return validateObject(x, {
        type: isEqualTo('setFile')
    })
}

// deleteFile

export type DeleteFileRequest = {
    type: 'deleteFile'
    timestamp: number
    workspaceId: string
    projectId: string
    fileName: string
}

export const isDeleteFileRequest = (x: any): x is DeleteFileRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteFile'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        fileName: isString
    })
}

export type DeleteFileResponse = {
    type: 'deleteFile'
}

export const isDeleteFileResponse = (x: any): x is DeleteFileResponse => {
    return validateObject(x, {
        type: isEqualTo('deleteFile')
    })
}

// duplicateFile

export type DuplicateFileRequest = {
    type: 'duplicateFile'
    timestamp: number
    workspaceId: string
    projectId: string
    fileName: string
    newFileName: string
}

export const isDuplicateFileRequest = (x: any): x is DuplicateFileRequest => {
    return validateObject(x, {
        type: isEqualTo('duplicateFile'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        fileName: isString,
        newFileName: isString
    })
}

export type DuplicateFileResponse = {
    type: 'duplicateFile'
}

export const isDuplicateFileResponse = (x: any): x is DuplicateFileResponse => {
    return validateObject(x, {
        type: isEqualTo('duplicateFile')
    })
}

// renameFile

export type RenameFileRequest = {
    type: 'renameFile'
    timestamp: number
    workspaceId: string
    projectId: string
    fileName: string
    newFileName: string
}

export const isRenameFileRequest = (x: any): x is RenameFileRequest => {
    return validateObject(x, {
        type: isEqualTo('renameFile'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        fileName: isString,
        newFileName: isString
    })
}

export type RenameFileResponse = {
    type: 'renameFile'
}

export const isRenameFileResponse = (x: any): x is RenameFileResponse => {
    return validateObject(x, {
        type: isEqualTo('renameFile')
    })
}

// getFile

export type GetFileRequest = {
    type: 'getFile'
    timestamp: number
    projectId: string
    fileName: string
}

export const isGetFileRequest = (x: any): x is GetFileRequest => {
    return validateObject(x, {
        type: isEqualTo('getFile'),
        timestamp: isNumber,
        projectId: isString,
        fileName: isString
    })
}

export type GetFileResponse = {
    type: 'getFile'
    file: NBFile
}

export const isGetFileResponse = (x: any): x is GetFileResponse => {
    return validateObject(x, {
        type: isEqualTo('getFile'),
        file: isNBFile
    })
}

// getDataBlob

export type GetDataBlobRequest = {
    type: 'getDataBlob'
    timestamp: number
    workspaceId: string
    projectId: string
    sha1: string
}

export const isGetDataBlobRequest = (x: any): x is GetDataBlobRequest => {
    return validateObject(x, {
        type: isEqualTo('getDataBlob'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        sha1: isString
    })
}

export type GetDataBlobResponse = {
    type: 'getDataBlob'
    content: string
}

export const isGetDataBlobResponse = (x: any): x is GetDataBlobResponse => {
    return validateObject(x, {
        type: isEqualTo('getDataBlob'),
        content: isString
    })
}

// deleteProject

export type DeleteProjectRequest = {
    type: 'deleteProject'
    timestamp: number
    workspaceId: string
    projectId: string
}

export const isDeleteProjectRequest = (x: any): x is DeleteProjectRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteProject'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString
    })
}

export type DeleteProjectResponse = {
    type: 'deleteProject'
}

export const isDeleteProjectResponse = (x: any): x is DeleteProjectResponse => {
    return validateObject(x, {
        type: isEqualTo('deleteProject')
    })
}

// setProjectProperty

export type SetProjectPropertyRequest = {
    type: 'setProjectProperty'
    timestamp: number
    projectId: string
    property: 'name'
    value: any
}

export const isSetProjectPropertyRequest = (x: any): x is SetProjectPropertyRequest => {
    return validateObject(x, {
        type: isEqualTo('setProjectProperty'),
        timestamp: isNumber,
        projectId: isString,
        property: isEqualTo('name'),
        value: () => (true)
    })
}

export type SetProjectPropertyResponse = {
    type: 'setProjectProperty'
}

export const isSetProjectPropertyResponse = (x: any): x is SetProjectPropertyResponse => {
    return validateObject(x, {
        type: isEqualTo('setProjectProperty')
    })
}

// getComputeResources

export type GetComputeResourcesRequest = {
    type: 'getComputeResources'
    timestamp: number
}

export const isGetComputeResourcesRequest = (x: any): x is GetComputeResourcesRequest => {
    return validateObject(x, {
        type: isEqualTo('getComputeResources'),
        timestamp: isNumber
    })
}

export type GetComputeResourcesResponse = {
    type: 'getComputeResources'
    computeResources: NBComputeResource[]
}

export const isGetComputeResourcesResponse = (x: any): x is GetComputeResourcesResponse => {
    return validateObject(x, {
        type: isEqualTo('getComputeResources'),
        computeResources: isArrayOf(isNBComputeResource)
    })
}

// getComputeResource

export type GetComputeResourceRequest = {
    type: 'getComputeResource'
    timestamp: number
    computeResourceId: string
}

export const isGetComputeResourceRequest = (x: any): x is GetComputeResourceRequest => {
    return validateObject(x, {
        type: isEqualTo('getComputeResource'),
        timestamp: isNumber,
        computeResourceId: isString
    })
}

export type GetComputeResourceResponse = {
    type: 'getComputeResource'
    computeResource: NBComputeResource
}

export const isGetComputeResourceResponse = (x: any): x is GetComputeResourceResponse => {
    return validateObject(x, {
        type: isEqualTo('getComputeResource'),
        computeResource: isNBComputeResource
    })
}

// registerComputeResource

export type RegisterComputeResourceRequest = {
    type: 'registerComputeResource'
    timestamp: number
    computeResourceId: string
    resourceCode: string
    name: string
}

export const isRegisterComputeResourceRequest = (x: any): x is RegisterComputeResourceRequest => {
    return validateObject(x, {
        type: isEqualTo('registerComputeResource'),
        timestamp: isNumber,
        computeResourceId: isString,
        resourceCode: isString,
        name: isString
    })
}

export type RegisterComputeResourceResponse = {
    type: 'registerComputeResource'
}

export const isRegisterComputeResourceResponse = (x: any): x is RegisterComputeResourceResponse => {
    return validateObject(x, {
        type: isEqualTo('registerComputeResource')
    })
}

// deleteComputeResource

export type DeleteComputeResourceRequest = {
    type: 'deleteComputeResource'
    timestamp: number
    computeResourceId: string
}

export const isDeleteComputeResourceRequest = (x: any): x is DeleteComputeResourceRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteComputeResource'),
        timestamp: isNumber,
        computeResourceId: isString
    })
}

export type DeleteComputeResourceResponse = {
    type: 'deleteComputeResource'
}

export const isDeleteComputeResourceResponse = (x: any): x is DeleteComputeResourceResponse => {
    return validateObject(x, {
        type: isEqualTo('deleteComputeResource')
    })
}

// createJob

export type CreateJobRequest = {
    type: 'createJob'
    timestamp: number
    workspaceId: string
    projectId: string
    processType: string
    inputFiles: {
        name: string
        fileId: string
        fileName: string
    }[]
    inputParameters: {
        name: string
        value: any
    }[]
    outputFiles: {
        name: string
        fileName: string
    }[]
}

export const isCreateJobRequest = (x: any): x is CreateJobRequest => {
    return validateObject(x, {
        type: isEqualTo('createJob'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        processType: isString,
        inputFiles: isArrayOf(y => (validateObject(y, {
            name: isString,
            fileId: isString,
            fileName: isString
        }))),
        inputParameters: isArrayOf(y => (validateObject(y, {
            name: isString,
            value: () => (true)
        }))),
        outputFiles: isArrayOf(y => (validateObject(y, {
            name: isString,
            fileName: isString
        })))
    })
}

export type CreateJobResponse = {
    type: 'createJob'
    jobId: string
}

export const isCreateJobResponse = (x: any): x is CreateJobResponse => {
    return validateObject(x, {
        type: isEqualTo('createJob'),
        jobId: isString
    })
}

// deleteJob

export type DeleteJobRequest = {
    type: 'deleteJob'
    timestamp: number
    workspaceId: string
    projectId: string
    jobId: string
}

export const isDeleteJobRequest = (x: any): x is DeleteJobRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteJob'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        jobId: isString
    })
}

export type DeleteJobResponse = {
    type: 'deleteJob'
}

export const isDeleteJobResponse = (x: any): x is DeleteJobResponse => {
    return validateObject(x, {
        type: isEqualTo('deleteJob')
    })
}

// getJob

export type GetJobRequest = {
    type: 'getJob'
    timestamp: number
    workspaceId: string
    projectId: string
    jobId: string
}

export const isGetJobRequest = (x: any): x is GetJobRequest => {
    return validateObject(x, {
        type: isEqualTo('getJob'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        jobId: isString
    })
}

export type GetJobResponse = {
    type: 'getJob'
    job: NBJob
}

export const isGetJobResponse = (x: any): x is GetJobResponse => {
    return validateObject(x, {
        type: isEqualTo('getJob'),
        job: isNBJob
    })
}

// getJobs

export type GetJobsRequest = {
    type: 'getJobs'
    timestamp: number
    computeResourceId?: string
    status?: 'pending' | 'running' | 'completed' | 'failed'
    projectId?: string
    nodeId?: string
    nodeName?: string
}

export const isGetJobsRequest = (x: any): x is GetJobsRequest => {
    return validateObject(x, {
        type: isEqualTo('getJobs'),
        timestamp: isNumber,
        computeResourceId: optional(isString),
        status: optional(isOneOf([isEqualTo('pending'), isEqualTo('running'), isEqualTo('completed'), isEqualTo('failed')])),
        projectId: optional(isString),
        nodeId: optional(isString),
        nodeName: optional(isString)
    })
}

export type GetJobsResponse = {
    type: 'getJobs'
    jobs: NBJob[]
}

export const isGetJobsResponse = (x: any): x is GetJobsResponse => {
    return validateObject(x, {
        type: isEqualTo('getJobs'),
        jobs: isArrayOf(isNBJob)
    })
}

// getActiveComputeResourceNodes

export type GetActiveComputeResourceNodesRequest = {
    type: 'getActiveComputeResourceNodes'
    timestamp: number
    computeResourceId: string
}

export const isGetActiveComputeResourceNodesRequest = (x: any): x is GetActiveComputeResourceNodesRequest => {
    return validateObject(x, {
        type: isEqualTo('getActiveComputeResourceNodes'),
        timestamp: isNumber,
        computeResourceId: isString
    })
}

export type GetActiveComputeResourceNodesResponse = {
    type: 'getActiveComputeResourceNodes'
    activeComputeResourceNodes: {
        nodeId: string
        nodeName: string
        timestampLastActive: number
    }[]
}

export const isGetActiveComputeResourceNodesResponse = (x: any): x is GetActiveComputeResourceNodesResponse => {
    return validateObject(x, {
        type: isEqualTo('getActiveComputeResourceNodes'),
        activeComputeResourceNodes: isArrayOf(y => (validateObject(y, {
            nodeId: isString,
            nodeName: isString,
            timestampLastActive: isNumber
        })))
    })
}

// setJobProperty

export type SetJobPropertyRequest = {
    type: 'setJobProperty'
    timestamp: number
    workspaceId: string
    projectId: string
    jobId: string
    property: string
    value: any
    computeResourceNodeId?: string
    computeResourceNodeName?: string
}

export const isSetJobPropertyRequest = (x: any): x is SetJobPropertyRequest => {
    return validateObject(x, {
        type: isEqualTo('setJobProperty'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        jobId: isString,
        property: isString,
        value: () => (true),
        computeResourceNodeId: optional(isString),
        computeResourceNodeName: optional(isString)
    })
}

export type SetJobPropertyResponse = {
    type: 'setJobProperty'
    success?: boolean
    error?: string
}

export const isSetJobPropertyResponse = (x: any): x is SetJobPropertyResponse => {
    return validateObject(x, {
        type: isEqualTo('setJobProperty'),
        success: optional(isBoolean),
        error: optional(isString)
    })
}

// GetPubsubSubscription

export type GetPubsubSubscriptionRequest = {
    type: 'getPubsubSubscription'
    timestamp: number
    computeResourceId: string
}

export const isGetPubsubSubscriptionRequest = (x: any): x is GetPubsubSubscriptionRequest => {
    return validateObject(x, {
        type: isEqualTo('getPubsubSubscription'),
        timestamp: isNumber,
        computeResourceId: isString
    })
}

export type GetPubsubSubscriptionResponse = {
    type: 'getPubsubSubscription'
    subscriptionInfo: any
}

export const isGetPubsubSubscriptionResponse = (x: any): x is GetPubsubSubscriptionResponse => {
    return validateObject(x, {
        type: isEqualTo('getPubsubSubscription'),
        subscriptionInfo: () => (true)
    })
}

// NeurobassRequestPayload

export type NeurobassRequestPayload =
    GetWorkspacesRequest |
    GetWorkspaceRequest |
    CreateWorkspaceRequest |
    GetProjectsRequest |
    GetProjectRequest |
    CreateProjectRequest |
    SetWorkspaceUsersRequest |
    SetWorkspacePropertyRequest |
    DeleteWorkspaceRequest |
    GetFilesRequest |
    SetFileRequest |
    DeleteFileRequest |
    DuplicateFileRequest |
    RenameFileRequest |
    GetFileRequest |
    GetDataBlobRequest |
    DeleteProjectRequest |
    SetProjectPropertyRequest |
    GetComputeResourcesRequest |
    GetComputeResourceRequest |
    RegisterComputeResourceRequest |
    DeleteComputeResourceRequest |
    CreateJobRequest |
    DeleteJobRequest |
    GetJobRequest |
    GetJobsRequest |
    GetActiveComputeResourceNodesRequest |
    SetJobPropertyRequest |
    GetPubsubSubscriptionRequest

export const isNeurobassRequestPayload = (x: any): x is NeurobassRequestPayload => {
    return isOneOf([
        isGetWorkspacesRequest,
        isGetWorkspaceRequest,
        isCreateWorkspaceRequest,
        isGetProjectsRequest,
        isGetProjectRequest,
        isCreateProjectRequest,
        isSetWorkspaceUsersRequest,
        isSetWorkspacePropertyRequest,
        isDeleteWorkspaceRequest,
        isGetFilesRequest,
        isSetFileRequest,
        isDeleteFileRequest,
        isDuplicateFileRequest,
        isRenameFileRequest,
        isGetFileRequest,
        isGetDataBlobRequest,
        isDeleteProjectRequest,
        isSetProjectPropertyRequest,
        isGetComputeResourcesRequest,
        isGetComputeResourceRequest,
        isRegisterComputeResourceRequest,
        isDeleteComputeResourceRequest,
        isCreateJobRequest,
        isDeleteJobRequest,
        isGetJobRequest,
        isGetJobsRequest,
        isGetActiveComputeResourceNodesRequest,
        isSetJobPropertyRequest,
        isGetPubsubSubscriptionRequest
    ])(x)
}

// NeurobassRequest

export type NeurobassRequest = {
    payload: NeurobassRequestPayload
    fromClientId?: string
    signature?: string
    userId?: string
    githubAccessToken?: string
}

export const isNeurobassRequest = (x: any): x is NeurobassRequest => {
    return validateObject(x, {
        payload: isNeurobassRequestPayload,
        fromClientId: optional(isString),
        signature: optional(isString),
        userId: optional(isString),
        githubAccessToken: optional(isString)
    })
}

// NeurobassResponse

export type NeurobassResponse =
    GetWorkspacesResponse |
    GetWorkspaceResponse |
    CreateWorkspaceResponse |
    GetProjectsResponse |
    GetProjectResponse |
    CreateProjectResponse |
    SetWorkspaceUsersResponse |
    SetWorkspacePropertyResponse |
    DeleteWorkspaceResponse |
    GetFilesResponse |
    SetFileResponse |
    DeleteFileResponse |
    DuplicateFileResponse |
    RenameFileResponse |
    GetFileResponse |
    GetDataBlobResponse |
    DeleteProjectResponse |
    SetProjectPropertyResponse |
    GetComputeResourcesResponse |
    GetComputeResourceResponse |
    RegisterComputeResourceResponse |
    DeleteComputeResourceResponse |
    CreateJobResponse |
    DeleteJobResponse |
    GetJobResponse |
    GetJobsResponse |
    GetActiveComputeResourceNodesResponse |
    SetJobPropertyResponse |
    GetPubsubSubscriptionResponse

export const isNeurobassResponse = (x: any): x is NeurobassResponse => {
    return isOneOf([
        isGetWorkspacesResponse,
        isGetWorkspaceResponse,
        isCreateWorkspaceResponse,
        isGetProjectsResponse,
        isGetProjectResponse,
        isCreateProjectResponse,
        isSetWorkspaceUsersResponse,
        isSetWorkspacePropertyResponse,
        isDeleteWorkspaceResponse,
        isGetFilesResponse,
        isSetFileResponse,
        isDeleteFileResponse,
        isDuplicateFileResponse,
        isRenameFileResponse,
        isGetFileResponse,
        isGetDataBlobResponse,
        isDeleteProjectResponse,
        isSetProjectPropertyResponse,
        isGetComputeResourcesResponse,
        isGetComputeResourceResponse,
        isRegisterComputeResourceResponse,
        isDeleteComputeResourceResponse,
        isCreateJobResponse,
        isDeleteJobResponse,
        isGetJobResponse,
        isGetJobsResponse,
        isGetActiveComputeResourceNodesResponse,
        isSetJobPropertyResponse,
        isGetPubsubSubscriptionResponse
    ])(x)
}
