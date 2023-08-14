import { FunctionComponent, useCallback, useMemo, useState } from "react";
import HBoxLayout from "../../components/HBoxLayout";
import { setFileText, setUrlFile } from "../../dbInterface/dbInterface";
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
    const [view, setView] = useState<'project' | 'import-nwb'>('project')
    const {projectId, openTab} = useProject()

    const handleImportNwb = useCallback(() => {
        setView('import-nwb')
    }, [])

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const handleCreateFile = useCallback(async (fileName: string, o: {url: string, metadata: any}) => {
        await setUrlFile(workspaceId, projectId, fileName, o.url, o.metadata, auth)
        openTab(`file:${fileName}`)
        setView('project')
    }, [workspaceId, projectId, openTab, auth])

    const leftPanelWidth = limit(width * 2 / 7, 200, 350)
    return (
        <SetupWorkspacePage
            workspaceId={workspaceId}
        >
            <div style={{position: 'absolute', width, height, overflow: 'hidden'}}>
                <div style={{position: 'absolute', width, height, overflow: 'hidden', visibility: view === 'project' ? 'visible' : 'hidden', background: 'white'}}>
                    <HBoxLayout
                        widths={[leftPanelWidth, width - leftPanelWidth]}
                        height={height}
                    >
                        <ProjectLeftPanel width={0} height={0} onImportNwb={handleImportNwb} />
                        <ProjectMainPanel width={0} height={0} />
                    </HBoxLayout>
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

const limit = (x: number, min: number, max: number) => {
    if (x < min) return min
    if (x > max) return max
    return x
}

export default WorkspacePage