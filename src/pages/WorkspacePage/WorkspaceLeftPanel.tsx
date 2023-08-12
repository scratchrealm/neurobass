import { Edit, Settings } from "@mui/icons-material";
import { FunctionComponent, useCallback } from "react";
import { useModalDialog } from "../../ApplicationBar";
import ModalWindow from "../../components/ModalWindow/ModalWindow";
import SmallIconButton from "../../components/SmallIconButton";
import ComputeResourceIdComponent from "../../ComputeResourceIdComponent";
import UserIdComponent from "../../UserIdComponent";
import BackButton from "./BackButton";
import { useWorkspace } from "./WorkspacePageContext";
import WorkspaceSettingsWindow from "./WorkspaceSettingsWindow";

type Props = {
    width: number
    height: number
}

const WorkspaceLeftPanel: FunctionComponent<Props> = ({ width, height }) => {
    const {workspaceId, workspace, workspaceRole, setWorkspaceProperty} = useWorkspace()
    const {visible: settingsWindowVisible, handleOpen: openSettingsWindow, handleClose: closeSettingsWindow} = useModalDialog()
    const padding = 10
    const W = width - 2 * padding
    const H = height - 2 * padding

    const handleEditWorkspaceName = useCallback(async () => {
        const newName = await prompt('Enter new workspace name:', workspace?.name || '')
        if (!newName) return
        setWorkspaceProperty('name', newName)
    }, [workspace, setWorkspaceProperty])

    return (
        <div style={{position: 'absolute', left: padding, top: padding, width: W, height: H, background: '#fafafa'}}>
            <div>
                <BackButton />
                <hr />
                <div style={{fontWeight: 'bold', whiteSpace: 'nowrap', paddingBottom: 10}}>
                    Workspace: {workspace?.name}&nbsp;
                    {
                        (workspaceRole === 'admin' || workspaceRole === 'editor') && (
                            <SmallIconButton onClick={handleEditWorkspaceName} title="Edit workspace name" icon={<Edit />} />
                        )
                    }
                </div>
            </div>
            <table className="table1">
                <tbody>
                    <tr>
                        <td>ID:</td>
                        <td>{workspaceId}</td>
                    </tr>
                    <tr>
                        <td>Owner:</td>
                        <td><UserIdComponent userId={workspace?.ownerId} /></td>
                    </tr>
                    <tr>
                        <td>Compute:</td>
                        <td><ComputeResourceIdComponent computeResourceId={workspace?.computeResourceId} link={true} /></td>
                    </tr>
                </tbody>
            </table>
            <div style={{paddingTop: 10}}>
                <button onClick={openSettingsWindow} title="Workspace settings"><SmallIconButton icon={<Settings />} /> Settings</button>
            </div>

            <hr />

            <ModalWindow
                open={settingsWindowVisible}
                onClose={closeSettingsWindow}
            >
                <WorkspaceSettingsWindow />
            </ModalWindow>
        </div>
    )
}

export default WorkspaceLeftPanel