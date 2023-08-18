import { FunctionComponent, useCallback, useMemo } from "react";
import HBoxLayout from "../../components/HBoxLayout";
import { setUrlFile } from "../../dbInterface/dbInterface";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import useRoute from "../../useRoute";
import { SetupWorkspacePage } from "../WorkspacePage/WorkspacePageContext";
import DandiNwbSelector from "./DandiNwbSelector/DandiNwbSelector";
import ManualNwbSelector from "./ManualNwbSelector/ManualNwbSelector";
import ProcessingToolsView from "./ProcessingToolsView";
import ProjectFiles from "./ProjectFiles";
import ProjectHome from "./ProjectHome";
import ProjectJobs from "./ProjectJobs";
import { SetupProjectPage, useProject } from "./ProjectPageContext";

type Props = {
    width: number
    height: number
    projectId: string
}

const ProjectPage: FunctionComponent<Props> = ({projectId, width, height}) => {
    return (
        <SetupProjectPage
            projectId={projectId}
        >
            <ProjectPageChild
                width={width}
                height={height}
                projectId={projectId}
            />
        </SetupProjectPage>
    )
}

export type ProjectPageViewType = 'project-home' | 'project-files' | 'project-jobs' | 'dandi-import' | 'manual-import' | 'processing-tools'

type ProjectPageView = {
    type: ProjectPageViewType
    label: string
}

const projectPageViews: ProjectPageView[] = [
    {
        type: 'project-home',
        label: 'Project home'
    },
    {
        type: 'project-files',
        label: 'Files'
    },
    {
        type: 'project-jobs',
        label: 'Jobs'
    },
    {
        type: 'dandi-import',
        label: 'DANDI import'
    },
    {
        type: 'manual-import',
        label: 'Manual import'
    },
    {
        type: 'processing-tools',
        label: 'Processing tools'
    }
]

const ProjectPageChild: FunctionComponent<Props> = ({width, height}) => {
    const {workspaceId} = useProject()

    const leftMenuPanelWidth = 150
    return (
        <SetupWorkspacePage
            workspaceId={workspaceId}
        >
            <div style={{position: 'absolute', width, height, overflow: 'hidden'}}>
                <HBoxLayout
                    widths={[leftMenuPanelWidth, width - leftMenuPanelWidth]}
                    height={height}
                >
                    <LeftMenuPanel
                        width={0}
                        height={0}
                    />
                    <MainPanel
                        width={0}
                        height={0}
                    />
                </HBoxLayout>
            </div>
        </SetupWorkspacePage>
    )
}

type LeftMenuPanelProps = {
    width: number
    height: number
}

const LeftMenuPanel: FunctionComponent<LeftMenuPanelProps> = ({width, height}) => {
    const {route, setRoute} = useRoute()
    const {projectId} = useProject()
    if (route.page !== 'project') throw Error(`Unexpected route ${JSON.stringify(route)}`)
    const currentView = route.tab || 'project-home'
    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden', background: '#fafafa'}}>
            {
                projectPageViews.map(view => (
                    <div
                        key={view.type}
                        style={{padding: 10, cursor: 'pointer', background: currentView === view.type ? '#ddd' : 'white'}}
                        onClick={() => setRoute({page: 'project', projectId, tab: view.type})}
                    >
                        {view.label}
                    </div>
                ))
            }
        </div>
    )
}

type MainPanelProps = {
    width: number
    height: number
}

const MainPanel: FunctionComponent<MainPanelProps> = ({width, height}) => {
    const {openTab, project, refreshFiles} = useProject()
    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])
    const {route, setRoute} = useRoute()
    if (route.page !== 'project') throw Error(`Unexpected route ${JSON.stringify(route)}`)
    const currentView = route.tab || 'project-home'

    const handleCreateFile = useCallback(async (fileName: string, o: {url: string, metadata: any}) => {
        if (!project) {
            console.warn('No project')
            return
        }
        await setUrlFile(project.workspaceId, project.projectId, fileName, o.url, o.metadata, auth)
        refreshFiles()
        openTab(`file:${fileName}`)
        setRoute({page: 'project', projectId: project.projectId, tab: 'project-files'})
    }, [project, openTab, auth, refreshFiles, setRoute])

    const handleImportDandiNwbFile = useCallback((nwbUrl: string, dandisetId: string, dandisetVersion: string, assetId: string, assetPath: string, useStaging: boolean) => {
        const metadata = {
            dandisetId,
            dandisetVersion,
            dandiAssetId: assetId,
            dandiAssetPath: assetPath,
            dandiStaging: useStaging
        }
        const stagingStr3 = useStaging ? 'staging-' : ''
        const fileName = stagingStr3 + dandisetId + '/' + assetPath
        handleCreateFile(fileName, {url: nwbUrl, metadata})
    }, [handleCreateFile])

    const handleImportManualNwbFile = useCallback((nwbUrl: string, fileName: string) => {
        const metadata = {}
        handleCreateFile(fileName, {url: nwbUrl, metadata})
    }, [handleCreateFile])

    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden', background: 'white'}}>
            <div style={{position: 'absolute', width, height, visibility: currentView === 'project-home' ? undefined : 'hidden'}}>
                <ProjectHome
                    width={width}
                    height={height}
                />
            </div>
            <div style={{position: 'absolute', width, height, visibility: currentView === 'project-files' ? undefined : 'hidden'}}>
                <ProjectFiles
                    width={width}
                    height={height}
                />
            </div>
            <div style={{position: 'absolute', width, height, visibility: currentView === 'project-jobs' ? undefined : 'hidden'}}>
                <ProjectJobs
                    width={width}
                    height={height}
                />
            </div>
            <div style={{position: 'absolute', width, height, visibility: currentView === 'dandi-import' ? undefined : 'hidden'}}>
                <DandiNwbSelector
                    width={width}
                    height={height}
                    onNwbFileSelected={handleImportDandiNwbFile}
                />
            </div>
            <div style={{position: 'absolute', width, height, visibility: currentView === 'manual-import' ? undefined : 'hidden'}}>
                <ManualNwbSelector
                    width={width}
                    height={height}
                    onNwbFileSelected={handleImportManualNwbFile}
                />
            </div>
            <div style={{position: 'absolute', width, height, visibility: currentView === 'processing-tools' ? undefined : 'hidden'}}>
                <ProcessingToolsView
                    width={width}
                    height={height}
                />
            </div>
        </div>
    )
}

export default ProjectPage