import { FunctionComponent, useCallback } from "react";
import Splitter from "../../components/Splitter";
import TabWidget from "../../TabWidget/TabWidget";
import { useWorkspace } from "../WorkspacePage/WorkspacePageContext";
import FileBrowser2, { FileIcon } from "./FileBrowser/FileBrowser2";
import FileEditor from "./FileEditor/FileEditor";
import { useProject } from "./ProjectPageContext";
import JobView from "./JobView/JobView";
import { confirm } from "../../confirm_prompt_alert";

const ProjectFiles: FunctionComponent<{width: number, height: number}> = ({width, height}) => {
    const {files, openTab, deleteFile, closeTab, duplicateFile, renameFile, openTabs, refreshFiles} = useProject()

    const handleOpenFile = useCallback((fileName: string) => {
        openTab(`file:${fileName}`)
    }, [openTab])

    const handleDeleteFile = useCallback(async (fileName: string) => {
        const okay = await confirm(`Delete ${fileName}?`)
        if (!okay) return
        deleteFile(fileName).then(() => refreshFiles())
        closeTab(`file:${fileName}`)
    }, [deleteFile, closeTab, refreshFiles])

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
        const existingFile = files?.find(f => f.fileName === newFileName)
        if (existingFile) {
            await alert(`File ${newFileName} already exists.`)
            return
        }
        duplicateFile(fileName, newFileName)
    }, [files, duplicateFile])

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
        const existingFile = files?.find(f => f.fileName === newFileName)
        if (existingFile) {
            await alert(`File ${newFileName} already exists.`)
            return
        }
        renameFile(fileName, newFileName)
    }, [files, renameFile])

    if (!files) return <div>Loading project files...</div>

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={width / 2}
            direction="horizontal"
            hideSecondChild={openTabs.length === 0}
        >
            <FileBrowser2
                width={0}
                height={0}
                files={files}
                onOpenFile={handleOpenFile}
                onDeleteFile={handleDeleteFile}
                onDuplicateFile={handleDuplicateFile}
                onRenameFile={handleRenameFile}
                hideSizeColumn={false}
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
                    <FileEditor
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
                tabName.startsWith('job:') ? (
                    <JobView
                        key={tabName}
                        jobId={tabName.slice('job:'.length)}
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
    else if (tabName.startsWith('job:')) {
        ret = 'job:' + tabName.slice('job:'.length)
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

export default ProjectFiles