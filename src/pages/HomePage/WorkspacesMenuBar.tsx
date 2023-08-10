import { FunctionComponent, useCallback } from "react";
import { useModalDialog } from "../../ApplicationBar";
import Hyperlink from "../../components/Hyperlink";
import ModalWindow from "../../components/ModalWindow/ModalWindow";
import { prompt } from "../../confirm_prompt_alert";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import { useSPMain } from "../../SPMainContext";
import CreateWorkspaceWindow from "./CreateWorkspaceWindow";

type Props = {
    // none
}

const WorkspacesMenuBar: FunctionComponent<Props> = () => {
    const {userId} = useGithubAuth()

    const {visible: createWorkspaceWindowVisible, handleOpen: openCreateWorkspaceWindow, handleClose: closeCreateWorkspaceWindow} = useModalDialog()
    
    return (
        <div>
            {
                userId ? (
                    <Hyperlink onClick={openCreateWorkspaceWindow}>Create a workspace</Hyperlink>
                ) : (
                    <span style={{cursor: 'default'}}>Log in to create a workspace</span>
                )
            }
            <ModalWindow
                open={createWorkspaceWindowVisible}
                onClose={closeCreateWorkspaceWindow}
            >
                <CreateWorkspaceWindow />
            </ModalWindow>
        </div>
    )
}

export default WorkspacesMenuBar