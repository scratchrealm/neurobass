import { FunctionComponent, useCallback, useMemo, useState } from "react";
import HBoxLayout from "../../components/HBoxLayout";
import { setUrlFile } from "../../dbInterface/dbInterface";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import { SetupWorkspacePage } from "../WorkspacePage/WorkspacePageContext";
import DandiNwbSelector from "./ImportNwbWindow/DandiNwbSelector/DandiNwbSelector";
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

export type ProjectPageViewType = 'project-home' | 'project-files' | 'project-jobs' | 'dandi-import' | 'processing-tools'

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
        type: 'processing-tools',
        label: 'Processing tools'
    }
]

const ProjectPageChild: FunctionComponent<Props> = ({width, height}) => {
    const {workspaceId} = useProject()
    const [currentView, setCurrentView] = useState<ProjectPageViewType>('project-home')

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
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                    />
                    <MainPanel
                        width={0}
                        height={0}
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                    />
                </HBoxLayout>
            </div>
        </SetupWorkspacePage>
    )
}

type LeftMenuPanelProps = {
    width: number
    height: number
    currentView: ProjectPageViewType
    setCurrentView: (view: ProjectPageViewType) => void
}

const LeftMenuPanel: FunctionComponent<LeftMenuPanelProps> = ({width, height, currentView, setCurrentView}) => {
    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden', background: '#fafafa'}}>
            {
                projectPageViews.map(view => (
                    <div
                        key={view.type}
                        style={{padding: 10, cursor: 'pointer', background: currentView === view.type ? '#ddd' : 'white'}}
                        onClick={() => setCurrentView(view.type)}
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
    currentView: ProjectPageViewType
    setCurrentView: (view: ProjectPageViewType) => void
}

const MainPanel: FunctionComponent<MainPanelProps> = ({width, height, currentView, setCurrentView}) => {
    const {openTab, project, refreshFiles} = useProject()
    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const handleCreateFile = useCallback(async (fileName: string, o: {url: string, metadata: any}) => {
        if (!project) {
            console.warn('No project')
            return
        }
        await setUrlFile(project.workspaceId, project.projectId, fileName, o.url, o.metadata, auth)
        refreshFiles()
        openTab(`file:${fileName}`)
        setCurrentView('project-files')
    }, [project, openTab, setCurrentView, auth, refreshFiles])

    const handleImportNwbFile = useCallback((nwbUrl: string, dandisetId: string, dandisetVersion: string, assetId: string, assetPath: string) => {
        const metadata = {
            dandisetId,
            dandisetVersion,
            dandiAssetId: assetId,
            dandiAssetPath: assetPath
        }
        const fileName = dandisetId + '/' + assetPath
        handleCreateFile(fileName, {url: nwbUrl, metadata})
    }, [handleCreateFile])
    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden', background: 'white'}}>
            <div style={{position: 'absolute', width, height, visibility: currentView === 'project-home' ? undefined : 'hidden'}}>
                <ProjectHome
                    width={width}
                    height={height}
                    setCurrentView={setCurrentView}
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
                    onNwbFileSelected={handleImportNwbFile}
                />
            </div>
        </div>
    )
}

export default ProjectPage