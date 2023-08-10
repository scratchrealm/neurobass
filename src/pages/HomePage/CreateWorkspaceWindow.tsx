import { FunctionComponent, useCallback, useState } from "react"
import { useSPMain } from "../../SPMainContext"
import useRoute from "../../useRoute"

type Props = {
    // none
}

const CreateWorkspaceWindow: FunctionComponent<Props> = () => {
    const [workspaceName, setWorkspaceName] = useState('')
    const {createWorkspace} = useSPMain()
    const {setRoute} = useRoute()
    const handleCreateWorkspace = useCallback(async () => {
        const workspaceId = await createWorkspace(workspaceName)
        setRoute({page: 'workspace', workspaceId})
    }, [createWorkspace, workspaceName, setRoute])

    const buttonEnabled = !!workspaceName
    
    return (
        <div>
            <h3>Create a workspace</h3>
            <p>
                Neurobass is organized into workspaces and projects, with
                each workspace containing one or more projects. You can control access
                privileges at the workspace level. If this is your first workspace,
                consider using your user name as the name of your workspace. You can
                edit this later.
            </p>
            <p>
                <b>Workspace name:</b>&nbsp;&nbsp;
                <input type="text" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} />
            </p>
            <p>
                <button disabled={!buttonEnabled} onClick={handleCreateWorkspace}>Create workspace</button>
            </p>
        </div>
    )
}

export default CreateWorkspaceWindow