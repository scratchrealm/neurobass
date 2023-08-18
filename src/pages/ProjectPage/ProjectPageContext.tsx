import React, { FunctionComponent, PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { createJob, deleteFile, deleteJob, deleteProject, duplicateFile, fetchFiles, fetchJobsForProject, fetchProject, renameFile, setProjectProperty } from '../../dbInterface/dbInterface';
import { useGithubAuth } from '../../GithubAuth/useGithubAuth';
import { onPubsubMessage } from '../../pubnub/pubnub';
import { NBFile, NBJob, NBProject } from '../../types/neurobass-types';

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
    project?: NBProject
    files?: NBFile[]
    openTabs: {
        tabName: string
        content?: string
        editedContent?: string
    }[]
    currentTabName?: string
    jobs?: NBJob[]
    openTab: (tabName: string) => void
    closeTab: (tabName: string) => void
    closeAllTabs: () => void
    setCurrentTab: (tabName: string) => void
    setTabContent: (tabName: string, content: string | undefined) => void
    setTabEditedContent: (tabName: string, editedContent: string) => void
    refreshFiles: () => void
    deleteProject: () => Promise<void>
    setProjectProperty: (property: 'name', value: any) => void
    createJob: (o: {scriptFileName: string}) => void
    deleteJob: (jobId: string) => Promise<void>
    refreshJobs: () => void
    deleteFile: (fileName: string) => Promise<void>
    duplicateFile: (fileName: string, newFileName: string) => Promise<void>
    renameFile: (fileName: string, newFileName: string) => Promise<void>
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
    setProjectProperty: () => {},
    createJob: () => {},
    deleteJob: async () => {},
    refreshJobs: () => {},
    deleteFile: async () => {},
    duplicateFile: async () => {},
    renameFile: async () => {},
    fileHasBeenEdited: () => false
})

export const SetupProjectPage: FunctionComponent<PropsWithChildren<Props>> = ({children, projectId}) => {
    const [project, setProject] = React.useState<NBProject | undefined>()
    const [files, setFiles] = React.useState<NBFile[] | undefined>()
    const [refreshFilesCode, setRefreshFilesCode] = React.useState(0)
    const refreshFiles = useCallback(() => setRefreshFilesCode(rfc => rfc + 1), [])

    const [jobs, setJobs] = React.useState<NBJob[] | undefined>(undefined)
    const [refreshJobsCode, setRefreshJobsCode] = React.useState(0)
    const refreshJobs = useCallback(() => setRefreshJobsCode(c => c + 1), [])

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
            setFiles(undefined)
            if (!projectId) return
            const af = await fetchFiles(projectId, auth)
            setFiles(af)
        })()
    }, [refreshFilesCode, projectId, auth])

    useEffect(() => {
        let canceled = false
        ;(async () => {
            setJobs(undefined)
            if (!projectId) return
            const x = await fetchJobsForProject(projectId, auth)
            if (canceled) return
            setJobs(x)
        })()
        return () => {canceled = true}
    }, [refreshJobsCode, projectId, auth])

    // if any jobs are newly completed, refresh the files
    const [previousJobs, setPreviousJobs] = React.useState<NBJob[] | undefined>(undefined)
    useEffect(() => {
        if (!jobs) return
        if (previousJobs) {
            const newlyCompletedJobs = jobs.filter(j => (
                j.status === 'completed' && (
                    !previousJobs.find(pj => (pj.jobId === j.jobId) && pj.status === 'completed')
                )
            ))
            if (newlyCompletedJobs.length > 0) {
                refreshFiles()
            }
        }
        setPreviousJobs(jobs)
    }, [jobs, previousJobs, refreshFiles])

    useEffect(() => {
        const cancel = onPubsubMessage(message => {
            if (message.type === 'jobStatusChanged') {
                if (message.projectId === projectId) {
                    refreshJobs()
                }
            }
        })
        return () => {cancel()}
    }, [projectId, refreshJobs])

    const createJobHandler = useCallback(async (o: {scriptFileName: string}) => {
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
        const oo = {
            toolName: 'script',
            inputFiles: [],
            inputParameters: [
                {
                    name: 'script_file',
                    value: o.scriptFileName
                }
            ],
            outputFiles: []
        }
        await createJob(project.workspaceId, projectId, oo, auth)
        refreshJobs()
    }, [project, projectId, refreshJobs, auth, openTabs])

    const deleteJobHandler = useCallback(async (jobId: string) => {
        if (!project) return
        await deleteJob(project.workspaceId, projectId, jobId, auth)
    }, [project, projectId, auth])

    const deleteProjectHandler = useMemo(() => (async () => {
        if (!project) return
        await deleteProject(project.workspaceId, projectId, auth)
    }), [project, projectId, auth])

    const setProjectPropertyHandler = useCallback(async (property: 'name', val: any) => {
        await setProjectProperty(projectId, property, val, auth)
        refreshProject()
    }, [projectId, refreshProject, auth])

    const deleteFileHandler = useCallback(async (fileName: string) => {
        if (!project) return
        await deleteFile(project.workspaceId, projectId, fileName, auth)
    }, [project, projectId, auth])

    const duplicateFileHandler = useCallback(async (fileName: string, newFileName: string) => {
        if (!project) return
        await duplicateFile(project.workspaceId, projectId, fileName, newFileName, auth)
        refreshFiles()
    }, [project, projectId, refreshFiles, auth])

    const renameFileHandler = useCallback(async (fileName: string, newFileName: string) => {
        if (!project) return
        await renameFile(project.workspaceId, projectId, fileName, newFileName, auth)
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
        files,
        openTabs: openTabs.openTabs,
        currentTabName: openTabs.currentTabName,
        jobs,
        openTab: (tabName: string) => openTabsDispatch({type: 'openTab', tabName}),
        closeTab: (tabName: string) => openTabsDispatch({type: 'closeTab', tabName}),
        closeAllTabs: () => openTabsDispatch({type: 'closeAllTabs'}),
        setCurrentTab: (tabName: string) => openTabsDispatch({type: 'setCurrentTab', tabName}),
        setTabContent: (tabName: string, content: string | undefined) => openTabsDispatch({type: 'setTabContent', tabName, content}),
        setTabEditedContent: (tabName: string, editedContent: string) => openTabsDispatch({type: 'setTabEditedContent', tabName, editedContent}),
        refreshFiles,
        deleteProject: deleteProjectHandler,
        setProjectProperty: setProjectPropertyHandler,
        refreshJobs,
        createJob: createJobHandler,
        deleteJob: deleteJobHandler,
        deleteFile: deleteFileHandler,
        duplicateFile: duplicateFileHandler,
        renameFile: renameFileHandler,
        fileHasBeenEdited
    }), [project, files, projectId, refreshFiles, openTabs, deleteProjectHandler, setProjectPropertyHandler, refreshJobs, jobs, createJobHandler, deleteJobHandler, deleteFileHandler, duplicateFileHandler, renameFileHandler, fileHasBeenEdited])

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