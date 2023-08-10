import { FunctionComponent } from "react";
import TabWidget from "../../TabWidget/TabWidget";
import { useWorkspace } from "../WorkspacePage/WorkspacePageContext";
import { FileIcon } from "./ProjectFileBrowser/ProjectFileBrowser2";
import ProjectFileEditor from "./ProjectFileEditor/ProjectFileEditor";
import { useProject } from "./ProjectPageContext";
import ScriptJobView from "./ScriptJobView/ScriptJobView";

const ProjectMainPanel: FunctionComponent<{width: number, height: number}> = ({width, height}) => {
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

const labelFromTabName = (tabName: string) => {
    if (tabName.startsWith('file:')) {
        return tabName.slice('file:'.length)
    }
    else if (tabName.startsWith('scriptJob:')) {
        return 'job:' + tabName.slice('scriptJob:'.length)
    }
    return tabName
}

const iconFromTabName = (tabName: string) => {
    if (tabName.startsWith('file:')) {
        return <FileIcon fileName={tabName.slice('file:'.length)} />
    }
    else return undefined
}

export default ProjectMainPanel