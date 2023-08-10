import React, { FunctionComponent, PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { createScriptJob, deleteProject, cloneProject, deleteProjectFile, deleteCompletedScriptJobs, deleteScriptJob, fetchProject, fetchProjectFiles, fetchScriptJobsForProject, setProjectProperty, duplicateProjectFile, renameProjectFile } from '../../dbInterface/dbInterface';
import { useGithubAuth } from '../../GithubAuth/useGithubAuth';
import { onPubsubMessage } from '../../pubnub/pubnub';
import { SPProject, SPProjectFile, SPScriptJob } from '../../types/neurobass-types';
import yaml from 'js-yaml'

type Props = {
    projectId: string
}

type OpenTabsState = {
    openTabs: {
        tabName: string
        content?: string
        editedContent?: string
    }[]
    currentTabName?: string
}

type OpenTabsAction = {
    type: 'openTab'
    tabName: string
} | {
    type: 'setTabContent'
    tabName: string
    content: string | undefined // undefined triggers a reload
} | {
    type: 'setTabEditedContent'
    tabName: string
    editedContent: string
} | {
    type: 'closeTab'
    tabName: string
} | {
    type: 'closeAllTabs'
} | {
    type: 'setCurrentTab'
    tabName: string
}

const openTabsReducer = (state: OpenTabsState, action: OpenTabsAction) => {
    switch (action.type) {
        case 'openTab':
            if (state.openTabs.find(x => x.tabName === action.tabName)) {
                return {
                    ...state,
                    currentTabName: action.tabName
                }
            }
            return {
                ...state,
                openTabs: [...state.openTabs, {tabName: action.tabName}],
                currentTabName: action.tabName
            }
        case 'setTabContent':
            return {
                ...state,
                openTabs: state.openTabs.map(x => {
                    if (x.tabName === action.tabName) {
                        return {
                            ...x,
                            content: action.content
                        }
                    }
                    return x
                })
            }
        case 'setTabEditedContent':
            return {
                ...state,
                openTabs: state.openTabs.map(x => {
                    if (x.tabName === action.tabName) {
                        return {
                            ...x,
                            editedContent: action.editedContent
                        }
                    }
                    return x
                })
            }
        case 'closeTab':
            if (!state.openTabs.find(x => x.tabName === action.tabName)) {
                return state
            }
            return {
                ...state,
                openTabs: state.openTabs.filter(x => x.tabName !== action.tabName),
                currentTabName: state.currentTabName === action.tabName ? state.openTabs[0]?.tabName : state.currentTabName
            }
        case 'closeAllTabs':
            return {
                ...state,
                openTabs: [],
                currentTabName: undefined
            }
        case 'setCurrentTab':
            if (!state.openTabs.find(x => x.tabName === action.tabName)) {
                return state
            }
            return {
                ...state,
                currentTabName: action.tabName
            }
    }
}

type ProjectPageContextType = {
    projectId: string
    workspaceId: string
    project?: SPProject
    projectFiles?: SPProjectFile[]
    openTabs: {
        tabName: string
        content?: string
        editedContent?: string
    }[]
    currentTabName?: string
    scriptJobs?: SPScriptJob[]
    openTab: (tabName: string) => void
    closeTab: (tabName: string) => void
    closeAllTabs: () => void
    setCurrentTab: (tabName: string) => void
    setTabContent: (tabName: string, content: string | undefined) => void
    setTabEditedContent: (tabName: string, editedContent: string) => void
    refreshFiles: () => void
    deleteProject: () => Promise<void>
    cloneProject: (newWorkspaceId: string) => Promise<string>
    setProjectProperty: (property: 'name', value: any) => void
    createScriptJob: (o: {scriptFileName: string}) => void
    deleteScriptJob: (scriptJobId: string) => void
    refreshScriptJobs: () => void
    deleteCompletedScriptJobs: (o: {scriptFileName: string}) => void
    deleteFile: (fileName: string) => void
    duplicateFile: (fileName: string, newFileName: string) => void
    renameFile: (fileName: string, newFileName: string) => void
    fileHasBeenEdited: (fileName: string) => boolean
}

const ProjectPageContext = React.createContext<ProjectPageContextType>({
    projectId: '',
    workspaceId: '',
    openTabs: [],
    currentTabName: undefined,
    openTab: () => {},
    closeTab: () => {},
    closeAllTabs: () => {},
    setCurrentTab: () => {},
    setTabContent: () => {},
    setTabEditedContent: () => {},
    refreshFiles: () => {},
    deleteProject: async () => {},
    cloneProject: async () => {return ''},
    setProjectProperty: () => {},
    createScriptJob: () => {},
    deleteScriptJob: () => {},
    refreshScriptJobs: () => {},
    deleteCompletedScriptJobs: () => {},
    deleteFile: () => {},
    duplicateFile: () => {},
    renameFile: () => {},
    fileHasBeenEdited: () => false
})

export const SetupProjectPage: FunctionComponent<PropsWithChildren<Props>> = ({children, projectId}) => {
    const [project, setProject] = React.useState<SPProject | undefined>()
    const [projectFiles, setProjectFiles] = React.useState<SPProjectFile[] | undefined>()
    const [refreshFilesCode, setRefreshFilesCode] = React.useState(0)
    const refreshFiles = useCallback(() => setRefreshFilesCode(rfc => rfc + 1), [])

    const [scriptJobs, setScriptJobs] = React.useState<SPScriptJob[] | undefined>(undefined)
    const [refreshScriptJobsCode, setRefreshScriptJobsCode] = React.useState(0)
    const refreshScriptJobs = useCallback(() => setRefreshScriptJobsCode(c => c + 1), [])

    const [refreshProjectCode, setRefreshProjectCode] = React.useState(0)
    const refreshProject = useCallback(() => setRefreshProjectCode(rac => rac + 1), [])

    const [openTabs, openTabsDispatch] = React.useReducer(openTabsReducer, {openTabs: [], currentTabName: undefined})

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    useEffect(() => {
        (async () => {
            setProject(undefined)
            if (!projectId) return
            const project = await fetchProject(projectId, auth)
            setProject(project)
        })()
    }, [projectId, auth, refreshProjectCode])

    useEffect(() => {
        (async () => {
            setProjectFiles(undefined)
            if (!projectId) return
            const af = await fetchProjectFiles(projectId, auth)
            setProjectFiles(af)
        })()
    }, [refreshFilesCode, projectId, auth])

    useEffect(() => {
        let canceled = false
        ;(async () => {
            setScriptJobs(undefined)
            if (!projectId) return
            const x = await fetchScriptJobsForProject(projectId, auth)
            if (canceled) return
            setScriptJobs(x)
        })()
        return () => {canceled = true}
    }, [refreshScriptJobsCode, projectId, auth])

    // if any script jobs are newly completed, refresh the files
    const [previousScriptJobs, setPreviousScriptJobs] = React.useState<SPScriptJob[] | undefined>(undefined)
    useEffect(() => {
        if (!scriptJobs) return
        if (previousScriptJobs) {
            const newlyCompletedJobs = scriptJobs.filter(j => (
                j.status === 'completed' && (
                    !previousScriptJobs.find(pj => (pj.scriptJobId === j.scriptJobId) && pj.status === 'completed')
                )
            ))
            if (newlyCompletedJobs.length > 0) {
                refreshFiles()
            }
        }
        setPreviousScriptJobs(scriptJobs)
    }, [scriptJobs, previousScriptJobs, refreshFiles])

    useEffect(() => {
        const cancel = onPubsubMessage(message => {
            if (message.type === 'scriptJobStatusChanged') {
                if (message.projectId === projectId) {
                    refreshScriptJobs()
                }
            }
        })
        return () => {cancel()}
    }, [projectId, refreshScriptJobs])

    const createScriptJobHandler = useCallback(async (o: {scriptFileName: string}) => {
        if (!project) return
        const t = openTabs.openTabs.find(x => x.tabName === `file:${o.scriptFileName}`)
        if (!t) {
            console.warn(`Could not find tab for script file ${o.scriptFileName}. Not creating job.`)
            return
        }
        if (t.content !== t.editedContent) {
            console.warn(`Script file ${o.scriptFileName} has been edited but not saved. Not creating job.`)
            return
        }
        let requiredResources: {numCpus: number, ramGb: number, timeoutSec: number} | undefined = undefined
        if (o.scriptFileName.endsWith('.nba')) {
            const nba: {[k: string]: any} = yaml.load(t.content || '') as any
            if (nba.required_resources) {
                requiredResources = {
                    numCpus: nba.required_resources.num_cpus || 1,
                    ramGb: nba.required_resources.ram_gb || 1,
                    timeoutSec: nba.required_resources.timeout_sec || 180
                }
            }
            else {
                requiredResources = {
                    numCpus: 1,
                    ramGb: 1,
                    timeoutSec: 180
                }
            }
        }
        else if (o.scriptFileName.endsWith('.py')) {
            requiredResources = {
                numCpus: 1,
                ramGb: 1,
                timeoutSec: 10
            }
        }
        const oo = {
            scriptFileName: o.scriptFileName,
            requiredResources
        }
        await createScriptJob(project.workspaceId, projectId, oo, auth)
        refreshScriptJobs()
    }, [project, projectId, refreshScriptJobs, auth, openTabs])

    const deleteScriptJobHandler = useCallback(async (scriptJobId: string) => {
        if (!project) return
        await deleteScriptJob(project.workspaceId, projectId, scriptJobId, auth)
        refreshScriptJobs()
    }, [project, projectId, refreshScriptJobs, auth])

    const deleteCompletedScriptJobsHandler = useCallback(async (o: {scriptFileName: string}) => {
        if (!project) return
        await deleteCompletedScriptJobs(project.workspaceId, projectId, o.scriptFileName, auth)
        refreshScriptJobs()
    }, [project, projectId, refreshScriptJobs, auth])

    const deleteProjectHandler = useMemo(() => (async () => {
        if (!project) return
        await deleteProject(project.workspaceId, projectId, auth)
    }), [project, projectId, auth])

    const cloneProjectHandler = useMemo(() => (async (newWorkspaceId: string) => {
        if (!project) return '' // should not happen
        const newProjectId = await cloneProject(project.workspaceId, projectId, newWorkspaceId, auth)
        return newProjectId
    }), [project, projectId, auth])

    const setProjectPropertyHandler = useCallback(async (property: 'name', val: any) => {
        await setProjectProperty(projectId, property, val, auth)
        refreshProject()
    }, [projectId, refreshProject, auth])

    const deleteFile = useCallback(async (fileName: string) => {
        if (!project) return
        await deleteProjectFile(project.workspaceId, projectId, fileName, auth)
        refreshFiles()
    }, [project, projectId, refreshFiles, auth])

    const duplicateFile = useCallback(async (fileName: string, newFileName: string) => {
        if (!project) return
        await duplicateProjectFile(project.workspaceId, projectId, fileName, newFileName, auth)
        refreshFiles()
    }, [project, projectId, refreshFiles, auth])

    const renameFile = useCallback(async (fileName: string, newFileName: string) => {
        if (!project) return
        await renameProjectFile(project.workspaceId, projectId, fileName, newFileName, auth)
        refreshFiles()
        openTabsDispatch({type: 'closeTab', tabName: `file:${fileName}`})
    }, [project, projectId, refreshFiles, auth])

    const fileHasBeenEdited = useMemo(() => ((fileName: string) => {
        const tab = openTabs.openTabs.find(x => x.tabName === `file:${fileName}`)
        if (!tab) return false
        return tab.editedContent !== tab.content
    }), [openTabs])

    const value: ProjectPageContextType = React.useMemo(() => ({
        projectId,
        workspaceId: project?.workspaceId ?? '',
        project,
        projectFiles,
        openTabs: openTabs.openTabs,
        currentTabName: openTabs.currentTabName,
        scriptJobs,
        openTab: (tabName: string) => openTabsDispatch({type: 'openTab', tabName}),
        closeTab: (tabName: string) => openTabsDispatch({type: 'closeTab', tabName}),
        closeAllTabs: () => openTabsDispatch({type: 'closeAllTabs'}),
        setCurrentTab: (tabName: string) => openTabsDispatch({type: 'setCurrentTab', tabName}),
        setTabContent: (tabName: string, content: string | undefined) => openTabsDispatch({type: 'setTabContent', tabName, content}),
        setTabEditedContent: (tabName: string, editedContent: string) => openTabsDispatch({type: 'setTabEditedContent', tabName, editedContent}),
        refreshFiles,
        deleteProject: deleteProjectHandler,
        cloneProject: cloneProjectHandler,
        setProjectProperty: setProjectPropertyHandler,
        refreshScriptJobs,
        createScriptJob: createScriptJobHandler,
        deleteScriptJob: deleteScriptJobHandler,
        deleteCompletedScriptJobs: deleteCompletedScriptJobsHandler,
        deleteFile,
        duplicateFile,
        renameFile,
        fileHasBeenEdited
    }), [project, projectFiles, projectId, refreshFiles, openTabs, deleteProjectHandler, cloneProjectHandler, setProjectPropertyHandler, refreshScriptJobs, scriptJobs, createScriptJobHandler, deleteScriptJobHandler, deleteCompletedScriptJobsHandler, deleteFile, duplicateFile, renameFile, fileHasBeenEdited])

    return (
        <ProjectPageContext.Provider value={value}>
            {children}
        </ProjectPageContext.Provider>
    )
}

export const useProject = () => {
    const context = React.useContext(ProjectPageContext)
    return context
}