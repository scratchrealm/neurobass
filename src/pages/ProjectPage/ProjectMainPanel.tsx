import { FunctionComponent, useCallback } from "react";
import Splitter from "../../components/Splitter";
import TabWidget from "../../TabWidget/TabWidget";
import { useWorkspace } from "../WorkspacePage/WorkspacePageContext";
import ProjectFileBrowser2, { FileIcon } from "./ProjectFileBrowser/ProjectFileBrowser2";
import ProjectFileEditor from "./ProjectFileEditor/ProjectFileEditor";
import { useProject } from "./ProjectPageContext";
import ScriptJobView from "./ScriptJobView/ScriptJobView";

const ProjectMainPanel: FunctionComponent<{width: number, height: number}> = ({width, height}) => {
    const {projectFiles, openTab, deleteFile, closeTab, duplicateFile, renameFile, openTabs} = useProject()

    const handleOpenFile = useCallback((fileName: string) => {
        openTab(`file:${fileName}`)
    }, [openTab])

    const handleDeleteFile = useCallback(async (fileName: string) => {
        const okay = await confirm(`Delete ${fileName}?`)
        if (!okay) return
        deleteFile(fileName)
        closeTab(`file:${fileName}`)
    }, [deleteFile, closeTab])

    const handleDuplicateFile = useCallback(async (fileName: string) => {
        let newFileName: string | null
        // eslint-disable-next-line no-constant-condition
        while (true) {
            newFileName = await prompt('Enter new file name:', fileName)
            if (!newFileName) return
            if (newFileName !== fileName) {
                break
            }
        }
        const existingFile = projectFiles?.find(f => f.fileName === newFileName)
        if (existingFile) {
            await alert(`File ${newFileName} already exists.`)
            return
        }
        duplicateFile(fileName, newFileName)
    }, [projectFiles, duplicateFile])

    const handleRenameFile = useCallback(async (fileName: string) => {
        let newFileName: string | null
        // eslint-disable-next-line no-constant-condition
        while (true) {
            newFileName = await prompt('Enter new file name:', fileName)
            if (!newFileName) return
            if (newFileName !== fileName) {
                break
            }
        }
        const existingFile = projectFiles?.find(f => f.fileName === newFileName)
        if (existingFile) {
            await alert(`File ${newFileName} already exists.`)
            return
        }
        renameFile(fileName, newFileName)
    }, [projectFiles, renameFile])

    if (!projectFiles) return <div>Loading project files...</div>

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={width / 2}
            direction="horizontal"
            hideSecondChild={openTabs.length === 0}
        >
            <ProjectFileBrowser2
                projectFiles={projectFiles}
                onOpenFile={handleOpenFile}
                onDeleteFile={handleDeleteFile}
                onDuplicateFile={handleDuplicateFile}
                onRenameFile={handleRenameFile}
                hideSizeColumn={true}
            />
            <ProjectTabWidget
                width={0}
                height={0}
            />
        </Splitter>
    )
}

const ProjectTabWidget: FunctionComponent<{width: number, height: number}> = ({width, height}) => {
    const {openTabs, currentTabName, setCurrentTab, closeTab, setTabContent, setTabEditedContent} = useProject()
    const {workspaceRole} = useWorkspace()
    const canEdit = workspaceRole === 'admin' || workspaceRole === 'editor'
    return (
        <TabWidget
            width={width}
            height={height}
            tabs={
                openTabs.map(({tabName}) => ({
                    id: tabName,
                    label: labelFromTabName(tabName),
                    closeable: true,
                    icon: iconFromTabName(tabName)
                }))
            }
            currentTabId={currentTabName}
            setCurrentTabId={setCurrentTab}
            onCloseTab={fileName => closeTab(fileName)}
        >
            {openTabs.map(({tabName, content, editedContent}) => (
                tabName.startsWith('file:') ? (
                    <ProjectFileEditor
                        key={tabName}
                        fileName={tabName.slice('file:'.length)}
                        fileContent={content}
                        editedFileContent={editedContent}
                        setFileContent={content => {
                            setTabContent(tabName, content)
                        }}
                        setEditedFileContent={content => {
                            setTabEditedContent(tabName, content)
                        }}
                        readOnly={!canEdit}
                        width={0}
                        height={0}
                    />
                ) :
                tabName.startsWith('scriptJob:') ? (
                    <ScriptJobView
                        key={tabName}
                        scriptJobId={tabName.slice('scriptJob:'.length)}
                        width={0}
                        height={0}
                    />
                ) :
                (
                    <div key={tabName}>Not implemented</div>
                )
            ))}
        </TabWidget>
    )
}

const maxTabLabelLength = 18

const labelFromTabName = (tabName: string) => {
    let ret = ''
    if (tabName.startsWith('file:')) {
        ret = tabName.slice('file:'.length)
    }
    else if (tabName.startsWith('scriptJob:')) {
        ret = 'job:' + tabName.slice('scriptJob:'.length)
    }
    else ret = tabName
    if (ret.length > maxTabLabelLength) {
        ret = ret.slice(0, maxTabLabelLength - 3) + '...'
    }
    return ret
}

const iconFromTabName = (tabName: string) => {
    if (tabName.startsWith('file:')) {
        return <FileIcon fileName={tabName.slice('file:'.length)} />
    }
    else return undefined
}

export default ProjectMainPanel