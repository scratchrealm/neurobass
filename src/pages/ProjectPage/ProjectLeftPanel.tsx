import { ContentCopy, Download, Edit, NoteAdd, PlayArrow, Refresh, Settings } from "@mui/icons-material";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { useModalDialog } from "../../ApplicationBar";
import Hyperlink from "../../components/Hyperlink";
import ModalWindow from "../../components/ModalWindow/ModalWindow";
import SmallIconButton from "../../components/SmallIconButton";
import { alert, confirm, prompt } from "../../confirm_prompt_alert";
import { setFileContent } from "../../dbInterface/dbInterface";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import useRoute from "../../useRoute";
import { useWorkspace } from "../WorkspacePage/WorkspacePageContext";
import BackButton from "./BackButton";
import NewAnalysisWindow from "./NewAnalysisWindow/NewAnalysisWindow";
import NewFileWindow from "./NewFileWindow/NewFileWindow";
import FileBrowser2 from "./FileBrowser/FileBrowser2";
import { useProject } from "./ProjectPageContext";
import ProjectSettingsWindow from "./ProjectSettingsWindow";

type Props = {
    width: number
    height: number
    onImportNwb: () => void
}

const ProjectLeftPanel: FunctionComponent<Props> = ({width, height, onImportNwb}) => {
    const {projectId, project, workspaceId, openTab, files, setProjectProperty, refreshFiles} = useProject()
    const {visible: settingsWindowVisible, handleOpen: openSettingsWindow, handleClose: closeSettingsWindow} = useModalDialog()
    const {visible: newFileWindowVisible, handleOpen: openNewFileWindow, handleClose: closeNewFileWindow} = useModalDialog()
    const {visible: newAnalysisWindowVisible, handleOpen: openNewAnalysisWindow, handleClose: closeNewAnalysisWindow} = useModalDialog()
    const {workspace, workspaceRole} = useWorkspace()
    const {setRoute} = useRoute()

    const handleEditProjectName = useCallback(async () => {
        const newName = await prompt('Enter new project name:', project?.name || '')
        if (!newName) return
        if (!project) return
        setProjectProperty('name', newName)
    }, [project, setProjectProperty])

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const handleCreateFile = useCallback(async (fileName: string, fileContent: string) => {
        await setFileContent(workspaceId, projectId, fileName, fileContent, auth)
        closeNewFileWindow()
        closeNewAnalysisWindow()
        refreshFiles()
        openTab(`file:${fileName}`)
    }, [workspaceId, projectId, auth, refreshFiles, openTab, closeNewFileWindow, closeNewAnalysisWindow])

    const padding = 10
    const W = width - 2 * padding
    const H = height - 2 * padding
    return (
        <div style={{position: 'absolute', left: padding, top: padding, width: W, height: H, background: '#fafafa'}}>
            <BackButton />
            <hr />
            <div style={{fontWeight: 'bold', whiteSpace: 'nowrap', paddingBottom: 10}}>
                Project: {project?.name}&nbsp;
                {
                    (workspaceRole === 'admin' || workspaceRole === 'editor') && (
                        <SmallIconButton onClick={handleEditProjectName} title="Edit project name" icon={<Edit />} />
                    )
                }
            </div>
            <table className="table1">
                <tbody>
                    <tr>
                        <td>ID:</td>
                        <td style={{whiteSpace: 'nowrap'}}>{projectId}</td>
                    </tr>
                    <tr>
                        <td>Workspace:</td>
                        <td style={{whiteSpace: 'nowrap'}}><Hyperlink onClick={() => {setRoute({page: 'workspace', workspaceId})}}>{workspace?.name}</Hyperlink></td>
                    </tr>
                </tbody>
            </table>
            <div style={{paddingTop: 10}}>
                <button onClick={openSettingsWindow} title="Project settings"><SmallIconButton icon={<Settings />} /> Settings</button>
            </div>

            <hr />

            <div style={{paddingBottom: 5}}>
                <SmallIconButton onClick={onImportNwb} title="Import NWB file" icon={<Download />} label="Import NWB" fontSize={24} />
                <br />
                <SmallIconButton onClick={openNewAnalysisWindow} title="Create a new analysis" icon={<PlayArrow />} label="Create analysis" fontSize={24} />
                <br />
                <SmallIconButton onClick={openNewFileWindow} title="Create a new file" icon={<NoteAdd />} label="Create file" fontSize={24} />
                &nbsp;&nbsp;
                <SmallIconButton onClick={refreshFiles} title="Refresh files" icon={<Refresh />} fontSize={24} />
            </div>

            <hr />

            {/* <FileBrowser2
                files={files}
                onOpenFile={handleOpenFile}
                onDeleteFile={handleDeleteFile}
                onDuplicateFile={handleDuplicateFile}
                onRenameFile={handleRenameFile}
            /> */}

            <ModalWindow
                open={settingsWindowVisible}
                onClose={closeSettingsWindow}
            >
                <ProjectSettingsWindow />
            </ModalWindow>
            <ModalWindow
                open={newFileWindowVisible}
                onClose={closeNewFileWindow}
            >
                <NewFileWindow
                    onCreateFile={handleCreateFile}
                />
            </ModalWindow>
            <ModalWindow
                open={newAnalysisWindowVisible}
                onClose={closeNewAnalysisWindow}
            >
                <NewAnalysisWindow
                    onCreateFile={handleCreateFile}
                />
            </ModalWindow>
        </div>
    )
}

export default ProjectLeftPanel