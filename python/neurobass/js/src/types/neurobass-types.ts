import validateObject, { isArrayOf, isBoolean, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

export type SPUser = {
    userId: string
}

export type SPWorkspace = {
    workspaceId: string
    ownerId: string
    name: string
    description: string
    users: {
        userId: string
        role: 'admin' | 'editor' | 'viewer'
    }[]
    publiclyReadable: boolean
    listed: boolean
    timestampCreated: number
    timestampModified: number
    computeResourceId?: string
}

export const isSPWorkspace = (x: any): x is SPWorkspace => {
    return validateObject(x, {
        workspaceId: isString,
        ownerId: isString,
        name: isString,
        description: isString,
        users: isArrayOf(y => (validateObject(y, {
            userId: isString,
            role: isOneOf([isEqualTo('admin'), isEqualTo('editor'), isEqualTo('viewer')])
        }))),
        publiclyReadable: isBoolean,
        listed: isBoolean,
        timestampCreated: isNumber,
        timestampModified: isNumber,
        computeResourceId: optional(isString)
    })
}

export type SPProject = {
    projectId: string
    workspaceId: string
    name: string
    description: string
    timestampCreated: number
    timestampModified: number
}

export const isSPProject = (x: any): x is SPProject => {
    return validateObject(x, {
        projectId: isString,
        workspaceId: isString,
        name: isString,
        description: isString,
        timestampCreated: isNumber,
        timestampModified: isNumber
    })
}

export type SPProjectFile = {
    projectId: string
    workspaceId: string
    fileName: string
    contentSha1: string
    contentSize: number
    timestampModified: number
}

export const isSPProjectFile = (x: any): x is SPProjectFile => {
    return validateObject(x, {
        projectId: isString,
        workspaceId: isString,
        fileName: isString,
        contentSha1: isString,
        contentSize: isNumber,
        timestampModified: isNumber
    })
}

export type SPCollection = {
    collectionId: string
    workspaceId: string
    name: string
    description: string
    timestampCreated: number
    timestampModified: number
    projectIds: string[]
}

export const isSPCollection = (x: any): x is SPCollection => {
    return validateObject(x, {
        collectionId: isString,
        workspaceId: isString,
        name: isString,
        description: isString,
        timestampCreated: isNumber,
        timestampModified: isNumber,
        projectIds: isArrayOf(isString)
    })
}

export type SPDataBlob = {
    workspaceId: string
    projectId: string
    sha1: string
    size: number
    content: string
}

export const isSPDataBlob = (x: any): x is SPDataBlob => {
    return validateObject(x, {
        workspaceId: isString,
        projectId: isString,
        sha1: isString,
        size: isNumber,
        content: isString
    })
}

export type SPComputeResource = {
    computeResourceId: string
    ownerId: string
    name: string
    timestampCreated: number
}

export const isSPComputeResource = (x: any): x is SPComputeResource => {
    return validateObject(x, {
        computeResourceId: isString,
        ownerId: isString,
        name: isString,
        timestampCreated: isNumber
    })
}

export type SPScriptJob = {
    scriptJobId: string
    workspaceId: string
    projectId: string
    userId?: string
    scriptFileName: string
    status: 'pending' | 'queued' | 'running' | 'completed' | 'failed'
    error?: string
    consoleOutput?: string
    computeResourceId: string
    computeResourceNodeId?: string
    computeResourceNodeName?: string
    timestampCreated: number
    timestampModified: number
    elapsedTimeSec?: number
    requiredResources?: {
        numCpus: number
        ramGb: number
        timeoutSec: number
    }
}

export const isSPScriptJob = (x: any): x is SPScriptJob => {
    return validateObject(x, {
        scriptJobId: isString,
        workspaceId: isString,
        projectId: isString,
        userId: optional(isString),
        scriptFileName: isString,
        status: isOneOf([isEqualTo('pending'), isEqualTo('queued'), isEqualTo('running'), isEqualTo('completed'), isEqualTo('failed')]),
        error: optional(isString),
        consoleOutput: optional(isString),
        computeResourceId: isString,
        computeResourceNodeId: optional(isString),
        computeResourceNodeName: optional(isString),
        timestampCreated: isNumber,
        timestampModified: isNumber,
        elapsedTimeSec: optional(isNumber),
        requiredResources: optional((y: any) => (validateObject(y, {
            numCpus: isNumber,
            ramGb: isNumber,
            timeoutSec: isNumber
        })))
    })
}