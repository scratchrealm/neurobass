import { FunctionComponent, useCallback } from "react";
import Hyperlink from "../../components/Hyperlink";
import { confirm } from "../../confirm_prompt_alert";
import useRoute from "../../useRoute";
import { useWorkspace } from "../WorkspacePage/WorkspacePageContext";
import { useProject } from "./ProjectPageContext";

type Props = {
    // none
}

const ProjectSettingsWindow: FunctionComponent<Props> = () => {
    const {project} = useProject()
    const {workspace, workspaceRole} = useWorkspace()
    const {setRoute} = useRoute()

    return (
        <div>
            <h3>Settings for project: {project?.name}</h3>
            <table>
                <tbody>
                    <tr>
                        <td>ID:</td>
                        <td style={{whiteSpace: 'nowrap'}}>{project?.projectId}</td>
                    </tr>
                    <tr>
                        <td>Workspace:</td>
                        <td style={{whiteSpace: 'nowrap'}}><Hyperlink onClick={() => setRoute({page: 'workspace', workspaceId: workspace?.workspaceId || ''})}>{workspace?.name}</Hyperlink></td>
                    </tr>
                </tbody>
            </table>
            <hr />
            <p>
                There are no project settings since all the access permissions are set at the workspace level.
                This window is a placeholder for when we might have project settings in the future.
                You can delete the project using the button below.
            </p>
            <hr />
            {
                (workspaceRole === 'admin' || workspaceRole === 'editor') ? (
                    <DeleteProjectButton />
                ) : (
                    <div>You do not have permission to edit this project.</div>
                )
            }
        </div>
    )
}

const DeleteProjectButton: FunctionComponent = () => {
    const {deleteProject, workspaceId} = useProject()
    const {setRoute} = useRoute()
    const handleDeleteProject = useCallback(async () => {
        const okay = await confirm('Are you sure you want to delete this project?')
        if (!okay) return
        await deleteProject()
        setRoute({page: 'workspace', workspaceId})
    }, [deleteProject, setRoute, workspaceId])

    return (
        <button onClick={handleDeleteProject}>Delete project</button>
    )
}

export default ProjectSettingsWindow;