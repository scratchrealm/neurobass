import { FunctionComponent, useCallback } from "react";
import { confirm } from "../../confirm_prompt_alert";
import UserIdComponent from "../../UserIdComponent";
import useRoute from "../../useRoute";
import WorkspaceComputeResourceComponent from "./WorkspaceComputeResourceComponent";
import { useWorkspace } from "./WorkspacePageContext";
import WorkspaceUsersComponent from "./WorkspaceUsersComponent";

type Props = {
    // none
}

const WorkspaceSettingsWindow: FunctionComponent<Props> = () => {
    const {workspaceId, workspace, workspaceRole} = useWorkspace()

    return (
        <div>
            <h3>Settings for workspace: {workspace?.name}</h3>
            <table>
                <tbody>
                    <tr>
                        <td>ID:</td>
                        <td>{workspaceId}</td>
                    </tr>
                    <tr>
                        <td>Owner:</td>
                        <td><UserIdComponent userId={workspace?.ownerId} /></td>
                    </tr>
                </tbody>
            </table>
            <hr />
            <WorkspaceUsersComponent />
            <hr />
            <WorkspaceComputeResourceComponent />
            <hr />
            {
                workspaceRole === 'admin' && (
                    <DeleteWorkspaceButton />
                )
            }
        </div>
    )
}

const DeleteWorkspaceButton: FunctionComponent = () => {
    const {deleteWorkspace} = useWorkspace()
    const {setRoute} = useRoute()
    const handleDeleteWorkspace = useCallback(async () => {
        const okay = await confirm('Are you sure you want to delete this workspace?')
        if (!okay) return
        await deleteWorkspace()
        setRoute({page: 'home'})
    }, [deleteWorkspace, setRoute])

    return (
        <button onClick={handleDeleteWorkspace}>Delete workspace</button>
    )
}

export default WorkspaceSettingsWindow;