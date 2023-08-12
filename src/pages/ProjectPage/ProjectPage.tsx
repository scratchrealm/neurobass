import { FunctionComponent, useCallback, useMemo, useState } from "react";
import Splitter from "../../components/Splitter";
import { setProjectFileContent } from "../../dbInterface/dbInterface";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import { SetupWorkspacePage } from "../WorkspacePage/WorkspacePageContext";
import ImportNwbWindow from "./ImportNwbWindow/ImportNwbWindow";
import ProjectLeftPanel from "./ProjectLeftPanel";
import ProjectMainPanel from "./ProjectMainPanel";
import { SetupProjectPage, useProject } from "./ProjectPageContext";

type Props = {
    width: number
    height: number
    projectId: string
}

const WorkspacePage: FunctionComponent<Props> = ({projectId, width, height}) => {
    return (
        <SetupProjectPage
            projectId={projectId}
        >
            <WorkspacePageChild
                width={width}
                height={height}
                projectId={projectId}
            />
        </SetupProjectPage>
    )
}

const WorkspacePageChild: FunctionComponent<Props> = ({width, height}) => {
    const {workspaceId} = useProject()
    const initialPosition = Math.max(250, Math.min(600, width / 4))
    const [view, setView] = useState<'project' | 'import-nwb'>('project')
    const {projectId, openTab} = useProject()

    const handleImportNwb = useCallback(() => {
        setView('import-nwb')
    }, [])
    
    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const handleCreateFile = useCallback(async (fileName: string, fileContent: string) => {
        await setProjectFileContent(workspaceId, projectId, fileName, fileContent, auth)
        openTab(`file:${fileName}`)
        setView('project')
    }, [workspaceId, projectId, openTab, auth])

    return (
        <SetupWorkspacePage
            workspaceId={workspaceId}
        >
            <div style={{position: 'absolute', width, height, overflow: 'hidden'}}>
                <div style={{position: 'absolute', width, height, overflow: 'hidden', visibility: view === 'project' ? 'visible' : 'hidden', background: 'white'}}>
                    <Splitter
                        width={width}
                        height={height}
                        initialPosition={initialPosition}
                        direction='horizontal'
                    >
                        <ProjectLeftPanel width={0} height={0} onImportNwb={handleImportNwb} />
                        <ProjectMainPanel width={0} height={0} />
                    </Splitter>
                </div>
                <div style={{position: 'absolute', width, height, overflow: 'hidden', visibility: view === 'import-nwb' ? 'visible' : 'hidden', background: 'white'}}>
                    <ImportNwbWindow
                        width={width}
                        height={height}
                        onCreateFile={handleCreateFile}
                        onClose={() => setView('project')}
                    />
                </div>
            </div>
        </SetupWorkspacePage>
    )
}   

export default WorkspacePage