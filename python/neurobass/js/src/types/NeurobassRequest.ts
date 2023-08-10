import { isSPProject, isSPProjectFile, isSPComputeResource, isSPScriptJob, isSPWorkspace, SPProject, SPProjectFile, SPComputeResource, SPScriptJob, SPWorkspace } from "./neurobass-types"
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
    workspaces: SPWorkspace[]
}

export const isGetWorkspacesResponse = (x: any): x is GetWorkspacesResponse => {
    return validateObject(x, {
        type: isEqualTo('getWorkspaces'),
        workspaces: isArrayOf(isSPWorkspace)
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
    workspace: SPWorkspace
}

export const isGetWorkspaceResponse = (x: any): x is GetWorkspaceResponse => {
    return validateObject(x, {
        type: isEqualTo('getWorkspace'),
        workspace: isSPWorkspace
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
    projects: SPProject[]
}

export const isGetProjectsResponse = (x: any): x is GetProjectsResponse => {
    return validateObject(x, {
        type: isEqualTo('getProjects'),
        projects: isArrayOf(isSPProject)
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
    project: SPProject
}

export const isGetProjectResponse = (x: any): x is GetProjectResponse => {
    return validateObject(x, {
        type: isEqualTo('getProject'),
        project: isSPProject
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

// getProjectFiles

export type GetProjectFilesRequest = {
    type: 'getProjectFiles'
    timestamp: number
    projectId: string
}

export const isGetProjectFilesRequest = (x: any): x is GetProjectFilesRequest => {
    return validateObject(x, {
        type: isEqualTo('getProjectFiles'),
        timestamp: isNumber,
        projectId: isString
    })
}

export type GetProjectFilesResponse = {
    type: 'getProjectFiles'
    projectFiles: SPProjectFile[]
}

export const isGetProjectFilesResponse = (x: any): x is GetProjectFilesResponse => {
    return validateObject(x, {
        type: isEqualTo('getProjectFiles'),
        projectFiles: isArrayOf(isSPProjectFile)
    })
}

// setProjectFile

export type SetProjectFileRequest = {
    type: 'setProjectFile'
    timestamp: number
    projectId: string
    workspaceId: string
    fileName: string
    fileContent: string
}

export const isSetProjectFileRequest = (x: any): x is SetProjectFileRequest => {
    return validateObject(x, {
        type: isEqualTo('setProjectFile'),
        timestamp: isNumber,
        projectId: isString,
        workspaceId: isString,
        fileName: isString,
        fileContent: isString
    })
}

export type SetProjectFileResponse = {
    type: 'setProjectFile'
}

export const isSetProjectFileResponse = (x: any): x is SetProjectFileResponse => {
    return validateObject(x, {
        type: isEqualTo('setProjectFile')
    })
}

// deleteProjectFile

export type DeleteProjectFileRequest = {
    type: 'deleteProjectFile'
    timestamp: number
    workspaceId: string
    projectId: string
    fileName: string
}

export const isDeleteProjectFileRequest = (x: any): x is DeleteProjectFileRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteProjectFile'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        fileName: isString
    })
}

export type DeleteProjectFileResponse = {
    type: 'deleteProjectFile'
}

export const isDeleteProjectFileResponse = (x: any): x is DeleteProjectFileResponse => {
    return validateObject(x, {
        type: isEqualTo('deleteProjectFile')
    })
}

// duplicateProjectFile

export type DuplicateProjectFileRequest = {
    type: 'duplicateProjectFile'
    timestamp: number
    workspaceId: string
    projectId: string
    fileName: string
    newFileName: string
}

export const isDuplicateProjectFileRequest = (x: any): x is DuplicateProjectFileRequest => {
    return validateObject(x, {
        type: isEqualTo('duplicateProjectFile'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        fileName: isString,
        newFileName: isString
    })
}

export type DuplicateProjectFileResponse = {
    type: 'duplicateProjectFile'
}

export const isDuplicateProjectFileResponse = (x: any): x is DuplicateProjectFileResponse => {
    return validateObject(x, {
        type: isEqualTo('duplicateProjectFile')
    })
}

// renameProjectFile

export type RenameProjectFileRequest = {
    type: 'renameProjectFile'
    timestamp: number
    workspaceId: string
    projectId: string
    fileName: string
    newFileName: string
}

export const isRenameProjectFileRequest = (x: any): x is RenameProjectFileRequest => {
    return validateObject(x, {
        type: isEqualTo('renameProjectFile'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        fileName: isString,
        newFileName: isString
    })
}

export type RenameProjectFileResponse = {
    type: 'renameProjectFile'
}

export const isRenameProjectFileResponse = (x: any): x is RenameProjectFileResponse => {
    return validateObject(x, {
        type: isEqualTo('renameProjectFile')
    })
}

// getProjectFile

export type GetProjectFileRequest = {
    type: 'getProjectFile'
    timestamp: number
    projectId: string
    fileName: string
}

export const isGetProjectFileRequest = (x: any): x is GetProjectFileRequest => {
    return validateObject(x, {
        type: isEqualTo('getProjectFile'),
        timestamp: isNumber,
        projectId: isString,
        fileName: isString
    })
}

export type GetProjectFileResponse = {
    type: 'getProjectFile'
    projectFile: SPProjectFile
}

export const isGetProjectFileResponse = (x: any): x is GetProjectFileResponse => {
    return validateObject(x, {
        type: isEqualTo('getProjectFile'),
        projectFile: isSPProjectFile
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

// cloneProject

export type CloneProjectRequest = {
    type: 'cloneProject'
    timestamp: number
    workspaceId: string
    projectId: string
    newWorkspaceId: string
}

export const isCloneProjectRequest = (x: any): x is CloneProjectRequest => {
    return validateObject(x, {
        type: isEqualTo('cloneProject'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        newWorkspaceId: isString
    })
}

export type CloneProjectResponse = {
    type: 'cloneProject'
    newProjectId: string
}

export const isCloneProjectResponse = (x: any): x is CloneProjectResponse => {
    return validateObject(x, {
        type: isEqualTo('cloneProject'),
        newProjectId: isString
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
    computeResources: SPComputeResource[]
}

export const isGetComputeResourcesResponse = (x: any): x is GetComputeResourcesResponse => {
    return validateObject(x, {
        type: isEqualTo('getComputeResources'),
        computeResources: isArrayOf(isSPComputeResource)
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
    computeResource: SPComputeResource
}

export const isGetComputeResourceResponse = (x: any): x is GetComputeResourceResponse => {
    return validateObject(x, {
        type: isEqualTo('getComputeResource'),
        computeResource: isSPComputeResource
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

// createScriptJob

export type CreateScriptJobRequest = {
    type: 'createScriptJob'
    timestamp: number
    workspaceId: string
    projectId: string
    scriptFileName: string
    requiredResources?: {
        numCpus: number
        ramGb: number
        timeoutSec: number
    }
}

export const isCreateScriptJobRequest = (x: any): x is CreateScriptJobRequest => {
    return validateObject(x, {
        type: isEqualTo('createScriptJob'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        scriptFileName: isString,
        requiredResources: optional((y: any) => (validateObject(y, {
            numCpus: isNumber,
            ramGb: isNumber,
            timeoutSec: isNumber
        })))
    })
}

export type CreateScriptJobResponse = {
    type: 'createScriptJob'
    scriptJobId: string
}

export const isCreateScriptJobResponse = (x: any): x is CreateScriptJobResponse => {
    return validateObject(x, {
        type: isEqualTo('createScriptJob'),
        scriptJobId: isString
    })
}

// deleteScriptJob

export type DeleteScriptJobRequest = {
    type: 'deleteScriptJob'
    timestamp: number
    workspaceId: string
    projectId: string
    scriptJobId: string
}

export const isDeleteScriptJobRequest = (x: any): x is DeleteScriptJobRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteScriptJob'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        scriptJobId: isString
    })
}

export type DeleteScriptJobResponse = {
    type: 'deleteScriptJob'
}

export const isDeleteScriptJobResponse = (x: any): x is DeleteScriptJobResponse => {
    return validateObject(x, {
        type: isEqualTo('deleteScriptJob')
    })
}

// deleteCompletedScriptJobs

export type DeleteCompletedScriptJobsRequest = {
    type: 'deleteCompletedScriptJobs'
    timestamp: number
    workspaceId: string
    projectId: string
    scriptFileName: string
}

export const isDeleteCompletedScriptJobsRequest = (x: any): x is DeleteCompletedScriptJobsRequest => {
    return validateObject(x, {
        type: isEqualTo('deleteCompletedScriptJobs'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        scriptFileName: isString
    })
}

export type DeleteCompletedScriptJobsResponse = {
    type: 'deleteCompletedScriptJobs'
}

export const isDeleteCompletedScriptJobsResponse = (x: any): x is DeleteCompletedScriptJobsResponse => {
    return validateObject(x, {
        type: isEqualTo('deleteCompletedScriptJobs')
    })
}

// getScriptJob

export type GetScriptJobRequest = {
    type: 'getScriptJob'
    timestamp: number
    workspaceId: string
    projectId: string
    scriptJobId: string
}

export const isGetScriptJobRequest = (x: any): x is GetScriptJobRequest => {
    return validateObject(x, {
        type: isEqualTo('getScriptJob'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        scriptJobId: isString
    })
}

export type GetScriptJobResponse = {
    type: 'getScriptJob'
    scriptJob: SPScriptJob
}

export const isGetScriptJobResponse = (x: any): x is GetScriptJobResponse => {
    return validateObject(x, {
        type: isEqualTo('getScriptJob'),
        scriptJob: isSPScriptJob
    })
}

// getScriptJobs

export type GetScriptJobsRequest = {
    type: 'getScriptJobs'
    timestamp: number
    computeResourceId?: string
    status?: 'pending' | 'running' | 'completed' | 'failed'
    projectId?: string
    nodeId?: string
    nodeName?: string
}

export const isGetScriptJobsRequest = (x: any): x is GetScriptJobsRequest => {
    return validateObject(x, {
        type: isEqualTo('getScriptJobs'),
        timestamp: isNumber,
        computeResourceId: optional(isString),
        status: optional(isOneOf([isEqualTo('pending'), isEqualTo('running'), isEqualTo('completed'), isEqualTo('failed')])),
        projectId: optional(isString),
        nodeId: optional(isString),
        nodeName: optional(isString)
    })
}

export type GetScriptJobsResponse = {
    type: 'getScriptJobs'
    scriptJobs: SPScriptJob[]
}

export const isGetScriptJobsResponse = (x: any): x is GetScriptJobsResponse => {
    return validateObject(x, {
        type: isEqualTo('getScriptJobs'),
        scriptJobs: isArrayOf(isSPScriptJob)
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

// setScriptJobProperty

export type SetScriptJobPropertyRequest = {
    type: 'setScriptJobProperty'
    timestamp: number
    workspaceId: string
    projectId: string
    scriptJobId: string
    property: string
    value: any
    computeResourceNodeId?: string
    computeResourceNodeName?: string
}

export const isSetScriptJobPropertyRequest = (x: any): x is SetScriptJobPropertyRequest => {
    return validateObject(x, {
        type: isEqualTo('setScriptJobProperty'),
        timestamp: isNumber,
        workspaceId: isString,
        projectId: isString,
        scriptJobId: isString,
        property: isString,
        value: () => (true),
        computeResourceNodeId: optional(isString),
        computeResourceNodeName: optional(isString)
    })
}

export type SetScriptJobPropertyResponse = {
    type: 'setScriptJobProperty'
    success?: boolean
    error?: string
}

export const isSetScriptJobPropertyResponse = (x: any): x is SetScriptJobPropertyResponse => {
    return validateObject(x, {
        type: isEqualTo('setScriptJobProperty'),
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
    GetProjectFilesRequest |
    SetProjectFileRequest |
    DeleteProjectFileRequest |
    DuplicateProjectFileRequest |
    RenameProjectFileRequest |
    GetProjectFileRequest |
    GetDataBlobRequest |
    DeleteProjectRequest |
    CloneProjectRequest |
    SetProjectPropertyRequest |
    GetComputeResourcesRequest |
    GetComputeResourceRequest |
    RegisterComputeResourceRequest |
    DeleteComputeResourceRequest |
    CreateScriptJobRequest |
    DeleteScriptJobRequest |
    DeleteCompletedScriptJobsRequest |
    GetScriptJobRequest |
    GetScriptJobsRequest |
    GetActiveComputeResourceNodesRequest |
    SetScriptJobPropertyRequest |
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
        isGetProjectFilesRequest,
        isSetProjectFileRequest,
        isDeleteProjectFileRequest,
        isDuplicateProjectFileRequest,
        isRenameProjectFileRequest,
        isGetProjectFileRequest,
        isGetDataBlobRequest,
        isDeleteProjectRequest,
        isCloneProjectRequest,
        isSetProjectPropertyRequest,
        isGetComputeResourcesRequest,
        isGetComputeResourceRequest,
        isRegisterComputeResourceRequest,
        isDeleteComputeResourceRequest,
        isCreateScriptJobRequest,
        isDeleteScriptJobRequest,
        isDeleteCompletedScriptJobsRequest,
        isGetScriptJobRequest,
        isGetScriptJobsRequest,
        isGetActiveComputeResourceNodesRequest,
        isSetScriptJobPropertyRequest,
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
    GetProjectFilesResponse |
    SetProjectFileResponse |
    DeleteProjectFileResponse |
    DuplicateProjectFileResponse |
    RenameProjectFileResponse |
    GetProjectFileResponse |
    GetDataBlobResponse |
    DeleteProjectResponse |
    CloneProjectResponse |
    SetProjectPropertyResponse |
    GetComputeResourcesResponse |
    GetComputeResourceResponse |
    RegisterComputeResourceResponse |
    DeleteComputeResourceResponse |
    CreateScriptJobResponse |
    DeleteScriptJobResponse |
    DeleteCompletedScriptJobsResponse |
    GetScriptJobResponse |
    GetScriptJobsResponse |
    GetActiveComputeResourceNodesResponse |
    SetScriptJobPropertyResponse |
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
        isGetProjectFilesResponse,
        isSetProjectFileResponse,
        isDeleteProjectFileResponse,
        isDuplicateProjectFileResponse,
        isRenameProjectFileResponse,
        isGetProjectFileResponse,
        isGetDataBlobResponse,
        isDeleteProjectResponse,
        isCloneProjectResponse,
        isSetProjectPropertyResponse,
        isGetComputeResourcesResponse,
        isGetComputeResourceResponse,
        isRegisterComputeResourceResponse,
        isDeleteComputeResourceResponse,
        isCreateScriptJobResponse,
        isDeleteScriptJobResponse,
        isDeleteCompletedScriptJobsResponse,
        isGetScriptJobResponse,
        isGetScriptJobsResponse,
        isGetActiveComputeResourceNodesResponse,
        isSetScriptJobPropertyResponse,
        isGetPubsubSubscriptionResponse
    ])(x)
}
