import { NBWorkspace } from "../src/types/neurobass-types"
import getWorkspaceRole from './getWorkspaceRole'

export const userCanCreateProject = (workspace: NBWorkspace, userId: string | undefined): boolean => {
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return ((workspaceRole === 'admin' || workspaceRole === 'editor'))
}

export const userCanCreateWorkspace = (userId: string | undefined): boolean => {
    if (userId) {
        return true
    }
    return false
}

export const userCanDeleteProject = (workspace: NBWorkspace, userId: string | undefined): boolean => {
    if (!userId) return false
    const workspaceRole = getWorkspaceRole(workspace, userId)
    if (workspaceRole === 'admin' || workspaceRole === 'editor') {
        return true
    }
    return false
}

export const userCanDeleteWorkspace = (workspace: NBWorkspace, userId: string | undefined): boolean => {
    if (!userId) {
        return false
    }
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return workspaceRole === 'admin'
}

export const userCanReadWorkspace = (workspace: NBWorkspace, userId: string | undefined, clientId: string | undefined): boolean => {
    if (clientId) {
        const computeResourceId = workspace.computeResourceId || process.env.VITE_DEFAULT_COMPUTE_RESOURCE_ID
        if ((computeResourceId) && (computeResourceId === clientId)) {
            return true
        }
    }
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return ((workspaceRole === 'admin' || workspaceRole === 'editor' || workspaceRole === 'viewer'))
}

export const userCanSetFile = (workspace: NBWorkspace, userId: string | undefined, clientId: string | undefined): boolean => {
    if (clientId) {
        const computeResourceId = workspace.computeResourceId || process.env.VITE_DEFAULT_COMPUTE_RESOURCE_ID
        if ((computeResourceId) && (computeResourceId === clientId)) {
            return true
        }
    }
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return ((workspaceRole === 'admin' || workspaceRole === 'editor'))
}

export const userCanDeleteFile = (workspace: NBWorkspace, userId: string | undefined, clientId: string | undefined): boolean => {
    if (!userId) {
        // anonymous cannot delete
        return false
    }
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return ((workspaceRole === 'admin' || workspaceRole === 'editor'))
}

export const userCanSetWorkspaceProperty = (workspace: NBWorkspace, userId: string | undefined): boolean => {
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return (workspaceRole === 'admin')
}

export const userCanSetWorkspaceUsers = (workspace: NBWorkspace, userId: string | undefined): boolean => {
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return (workspaceRole === 'admin')
}

export const userCanSetProjectProperty = (workspace: NBWorkspace, userId: string | undefined, property: string): boolean => {
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return ((workspaceRole === 'admin' || workspaceRole === 'editor'))
}