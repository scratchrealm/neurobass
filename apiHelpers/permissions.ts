import { SPWorkspace } from "../src/types/neurobass-types"
import getWorkspaceRole from './getWorkspaceRole'

export const userCanCreateProject = (workspace: SPWorkspace, userId: string | undefined): boolean => {
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return ((workspaceRole === 'admin' || workspaceRole === 'editor'))
}

export const userCanCreateWorkspace = (userId: string | undefined): boolean => {
    if (userId) {
        return true
    }
    return false
}

export const userCanDeleteProject = (workspace: SPWorkspace, userId: string | undefined): boolean => {
    if (!userId) return false
    const workspaceRole = getWorkspaceRole(workspace, userId)
    if (workspaceRole === 'admin' || workspaceRole === 'editor') {
        return true
    }
    return false
}

export const userCanDeleteWorkspace = (workspace: SPWorkspace, userId: string | undefined): boolean => {
    if (!userId) {
        return false
    }
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return workspaceRole === 'admin'
}

export const userCanReadWorkspace = (workspace: SPWorkspace, userId: string | undefined, clientId: string | undefined): boolean => {
    if (clientId) {
        const computeResourceId = workspace.computeResourceId || process.env.VITE_DEFAULT_COMPUTE_RESOURCE_ID
        if ((computeResourceId) && (computeResourceId === clientId)) {
            return true
        }
    }
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return ((workspaceRole === 'admin' || workspaceRole === 'editor' || workspaceRole === 'viewer'))
}

export const userCanSetProjectFile = (workspace: SPWorkspace, userId: string | undefined, clientId: string | undefined): boolean => {
    if (clientId) {
        const computeResourceId = workspace.computeResourceId || process.env.VITE_DEFAULT_COMPUTE_RESOURCE_ID
        if ((computeResourceId) && (computeResourceId === clientId)) {
            return true
        }
    }
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return ((workspaceRole === 'admin' || workspaceRole === 'editor'))
}

export const userCanDeleteProjectFile = (workspace: SPWorkspace, userId: string | undefined, clientId: string | undefined): boolean => {
    if (!userId) {
        // anonymous cannot delete
        return false
    }
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return ((workspaceRole === 'admin' || workspaceRole === 'editor'))
}

export const userCanSetWorkspaceProperty = (workspace: SPWorkspace, userId: string | undefined): boolean => {
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return (workspaceRole === 'admin')
}

export const userCanSetWorkspaceUsers = (workspace: SPWorkspace, userId: string | undefined): boolean => {
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return (workspaceRole === 'admin')
}

export const userCanSetProjectProperty = (workspace: SPWorkspace, userId: string | undefined, property: string): boolean => {
    const workspaceRole = getWorkspaceRole(workspace, userId)
    return ((workspaceRole === 'admin' || workspaceRole === 'editor'))
}