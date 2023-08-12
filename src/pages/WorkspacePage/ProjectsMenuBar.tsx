import { Add } from "@mui/icons-material";
import { FunctionComponent } from "react";
import { useModalDialog } from "../../ApplicationBar";
import Hyperlink from "../../components/Hyperlink";
import ModalWindow from "../../components/ModalWindow/ModalWindow";
import SmallIconButton from "../../components/SmallIconButton";
import CreateProjectWindow from "./CreateProjectWindow/CreateProjectWindow";
import { useWorkspace } from "./WorkspacePageContext";

type Props = {
    // none
}

const ProjectsMenuBar: FunctionComponent<Props> = () => {
    const {workspaceRole} = useWorkspace()
    const {visible: createProjectWindowVisible, handleOpen: openCreateProjectWindow, handleClose: closeCreateProjectWindow} = useModalDialog()

    // const handleCreateProject = useCallback(() => {
    //     (async () => {
    //         const projectName = await prompt('Enter project name:', 'Untitled')
    //         if (!projectName) return
    //         const projectId = await createProject(projectName)
    //         setRoute({page: 'project', projectId})
    //     })()
    // }, [createProject, setRoute])
    
    return (
        <div>
            {
                workspaceRole === 'admin' || workspaceRole === 'editor' ? (
                    <SmallIconButton fontSize={20} icon={<Add />} label="Create project" onClick={() => openCreateProjectWindow()} />
                ) : (
                    <span>&nbsp;</span>
                )
            }
            <ModalWindow
                open={createProjectWindowVisible}
                onClose={closeCreateProjectWindow}
            >
                <CreateProjectWindow
                    onClose={closeCreateProjectWindow}
                />
            </ModalWindow>
        </div>
    )
}

export default ProjectsMenuBar