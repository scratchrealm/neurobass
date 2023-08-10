import { ContentCopy } from "@mui/icons-material"
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react"
import Hyperlink from "../../../components/Hyperlink"
import SmallIconButton from "../../../components/SmallIconButton"
import { prompt } from "../../../confirm_prompt_alert"
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth"
import { useSPMain } from "../../../SPMainContext"
import useRoute from "../../../useRoute"
import { useWorkspace } from "../../WorkspacePage/WorkspacePageContext"
import { useProject } from "../ProjectPageContext"

type Props = {
    onClose: () => void
}

const CloneProjectWindow: FunctionComponent<Props> = ({onClose}) => {
    const {projectId, project, workspaceId, cloneProject} = useProject()
    const {workspaceRole} = useWorkspace()
    const {createWorkspace} = useSPMain()
    const [cloneIntoThisWorkspace, setCloneIntoThisWorkspace] = useState(true)
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(undefined)
    const {setRoute} = useRoute()

    const canEditWorkspace = workspaceRole === 'admin' || workspaceRole === 'editor'

    useEffect(() => {
        if (cloneIntoThisWorkspace) {
            setSelectedWorkspaceId(workspaceId)
        }
    }, [cloneIntoThisWorkspace, workspaceId])
    const handleClone = useCallback(async () => {
        if (!selectedWorkspaceId) return
        const newProjectId = await cloneProject(selectedWorkspaceId)
        setRoute({page: 'project', projectId: newProjectId})
        onClose()
    }, [cloneProject, selectedWorkspaceId, setRoute, onClose])
    useEffect(() => {
        // initialization
        if (canEditWorkspace) {
            setCloneIntoThisWorkspace(true)
        }
        else {
            setCloneIntoThisWorkspace(false)
        }
    }, [canEditWorkspace])

    const handleCreateWorkspace = useCallback(async () => {
        const workspaceName = await prompt('Enter workspace name:', 'Untitled')
        if (!workspaceName) return
        const newWorkspaceId = await createWorkspace(workspaceName)
        setSelectedWorkspaceId(newWorkspaceId)
    }, [createWorkspace])

    return (
        <div>
            <h3>Clone project: {project?.name} ({projectId})</h3>

            <div>
                <div onClick={() => {canEditWorkspace && setCloneIntoThisWorkspace(true)}} style={{cursor: 'pointer'}}>
                    {/* Note: I had to put a dummy onChange handler to suppress a React warning */}
                    <input type="radio" disabled={!canEditWorkspace} checked={cloneIntoThisWorkspace} onChange={() => {}} /> Clone into this workspace
                </div>
                <div onClick={() => setCloneIntoThisWorkspace(false)} style={{cursor: 'pointer'}}>
                    <input type="radio" checked={!cloneIntoThisWorkspace} onChange={() => {}} /> Clone into a different workspace
                </div>
            </div>
            <hr />
            {
                !cloneIntoThisWorkspace && (
                    <div>
                        <SelectWorkspaceComponent selectedWorkspaceId={selectedWorkspaceId} setSelectedWorkspaceId={setSelectedWorkspaceId} />
                        <div>&nbsp;</div>
                        <Hyperlink onClick={handleCreateWorkspace} color="gray">Create a new workspace</Hyperlink>
                    </div>
                )
            }
            <div>&nbsp;</div>
            <button onClick={handleClone}><SmallIconButton icon={<ContentCopy />} /> Create cloned project</button>
        </div>
    )
}

type SelectWorkspaceComponentProps = {
    selectedWorkspaceId: string | undefined
    setSelectedWorkspaceId: (workspaceId: string | undefined) => void
}

const SelectWorkspaceComponent: FunctionComponent<SelectWorkspaceComponentProps> = ({selectedWorkspaceId, setSelectedWorkspaceId}) => {
    const {workspaces} = useSPMain()

    const {userId} = useGithubAuth()

    const workspacesFiltered = useMemo(() => (
        workspaces ? workspaces.filter(workspace => (
            userId?.startsWith('admin|') || workspace.ownerId === userId || workspace.users.filter(u => (u.role === 'admin' || u.role === 'editor')).map(u => u.userId).includes(userId || '')
        )) : undefined
    ), [workspaces, userId])

    if (!workspacesFiltered) return <p>Loading...</p>

    return (
        <div>
            <select value={selectedWorkspaceId} onChange={e => setSelectedWorkspaceId(e.target.value)}>
                <option value={undefined}>Select a workspace</option>
                {
                    workspacesFiltered.map(workspace => (
                        <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.name}</option>
                    ))
                }
            </select>
        </div>
    )
}

export default CloneProjectWindow