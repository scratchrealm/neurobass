import { Edit, NoteAdd, Refresh, Settings } from "@mui/icons-material";
import { FunctionComponent, useCallback, useMemo } from "react";
import { useModalDialog } from "../../ApplicationBar";
import Hyperlink from "../../components/Hyperlink";
import ModalWindow from "../../components/ModalWindow/ModalWindow";
import SmallIconButton from "../../components/SmallIconButton";
import { prompt } from "../../confirm_prompt_alert";
import { setFileText } from "../../dbInterface/dbInterface";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import { timeAgoString } from "../../timeStrings";
import useRoute from "../../useRoute";
import { useWorkspace } from "../WorkspacePage/WorkspacePageContext";
import BackButton from "./BackButton";
import NewFileWindow from "./NewFileWindow/NewFileWindow";
import { useProject } from "./ProjectPageContext";
import ProjectSettingsWindow from "./ProjectSettingsWindow";

type Props = {
    width: number
    height: number
}

const ProjectHome: FunctionComponent<Props> = ({width, height}) => {
    const {setRoute} = useRoute()
    const {project, files, jobs, workspaceId, projectId} = useProject()
    const {workspace} = useWorkspace()
    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden', padding: 10, background: 'white'}}>
            <div style={{fontSize: 20, fontWeight: 'bold'}}>Project: {project?.name}</div>
            &nbsp;
            <table className="table1" style={{maxWidth: 500}}>
                <tbody>
                    <tr>
                        <td>Project name:</td>
                        <td>{project?.name}</td>
                    </tr>
                    <tr>
                        <td>Project ID:</td>
                        <td>{project?.projectId}</td>
                    </tr>
                    <tr>
                        <td>Workspace:</td>
                        <td><Hyperlink onClick={() => setRoute({page: 'workspace', workspaceId})}>{workspace?.name}</Hyperlink></td>
                    </tr>
                    <tr>
                        <td>Created:</td>
                        <td>{timeAgoString(project?.timestampCreated)}</td>
                    </tr>
                    <tr>
                        <td>Modified:</td>
                        <td>{timeAgoString(project?.timestampModified)}</td>
                    </tr>
                    <tr>
                        <td>Num. files:</td>
                        <td>{files?.length} (<Hyperlink onClick={() => setRoute({page: 'project', projectId, tab: 'project-files'})}>view files</Hyperlink>)</td>
                    </tr>
                    <tr>
                        <td>Num. jobs:</td>
                        <td>{jobs?.length} (<Hyperlink onClick={() => setRoute({page: 'project', projectId, tab: 'project-jobs'})}>view jobs</Hyperlink>)</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

const ProjectHomeOld: FunctionComponent<Props> = ({width, height}) => {
    const {projectId, project, workspaceId, openTab, setProjectProperty, refreshFiles} = useProject()
    const {visible: settingsWindowVisible, handleOpen: openSettingsWindow, handleClose: closeSettingsWindow} = useModalDialog()
    const {visible: newFileWindowVisible, handleOpen: openNewFileWindow, handleClose: closeNewFileWindow} = useModalDialog()
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
        await setFileText(workspaceId, projectId, fileName, fileContent, auth)
        closeNewFileWindow()
        refreshFiles()
        openTab(`file:${fileName}`)
    }, [workspaceId, projectId, auth, refreshFiles, openTab, closeNewFileWindow])

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
                {/* <SmallIconButton onClick={onImportNwb} title="Import NWB file" icon={<Download />} label="Import NWB" fontSize={24} />
                <br /> */}
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
        </div>
    )
}

export default ProjectHome