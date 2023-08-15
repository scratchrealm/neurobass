import { Add, Delete, DriveFileRenameOutline, FileCopy } from "@mui/icons-material"
import { FunctionComponent, useCallback, useMemo, useState } from "react"
import { useModalDialog } from "../../../ApplicationBar"
import ModalWindow from "../../../components/ModalWindow/ModalWindow"
import SmallIconButton from "../../../components/SmallIconButton"
import { confirm, prompt } from "../../../confirm_prompt_alert"
import { setFileText } from "../../../dbInterface/dbInterface"
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth"
import NewFileWindow from "../NewFileWindow/NewFileWindow"
import { useProject } from "../ProjectPageContext"

type FileBrowserMenuBarProps = {
    width: number
    height: number
    selectedFileNames: string[]
    onResetSelection: () => void
}

const FileBrowserMenuBar: FunctionComponent<FileBrowserMenuBarProps> = ({ width, height, selectedFileNames, onResetSelection }) => {
    const {deleteFile, renameFile, duplicateFile, refreshFiles, workspaceId, projectId, openTab} = useProject()
    const [operating, setOperating] = useState(false)
    const {visible: newFileWindowVisible, handleOpen: openNewFileWindow, handleClose: closeNewFileWindow} = useModalDialog()
    const handleDelete = useCallback(async () => {
        const okay = await confirm(`Are you sure you want to delete these ${selectedFileNames.length} files?`)
        if (!okay) return
        try {
            setOperating(true)
            for (const fileName of selectedFileNames) {
                await deleteFile(fileName)
            }
        }
        finally {
            setOperating(false)
            refreshFiles()
            onResetSelection()
        }
    }, [selectedFileNames, deleteFile, refreshFiles, onResetSelection])

    const handleRename = useCallback(async () => {
        const oldFileName = selectedFileNames[0]
        if (!oldFileName) return
        const newFileName = await prompt(`Rename ${oldFileName} to:`, oldFileName)
        if (!newFileName) return
        if (newFileName === oldFileName) return
        try {
            setOperating(true)
            await renameFile(oldFileName, newFileName)
        }
        finally {
            setOperating(false)
        }
    }, [selectedFileNames, renameFile])

    const handleDuplicate = useCallback(async () => {
        const oldFileName = selectedFileNames[0]
        if (!oldFileName) return
        const newFileName = await prompt(`Duplicate ${oldFileName} to:`, oldFileName)
        if (!newFileName) return
        if (newFileName === oldFileName) return
        try {
            setOperating(true)
            await duplicateFile(oldFileName, newFileName)
        }
        finally {
            setOperating(false)
        }
    }, [selectedFileNames, duplicateFile])

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const handleCreateFile = useCallback(async (fileName: string, fileContent: string) => {
        await setFileText(workspaceId, projectId, fileName, fileContent, auth)
        closeNewFileWindow()
        refreshFiles()
        openTab(`file:${fileName}`)
    }, [workspaceId, projectId, auth, closeNewFileWindow, refreshFiles, openTab])
    return (
        <div>
            <SmallIconButton
                icon={<Add />}
                disabled={operating}
                title="Add a new file"
                label="Add file"
                onClick={openNewFileWindow}
            />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <SmallIconButton
                icon={<Delete />}
                disabled={(selectedFileNames.length === 0) || operating}
                title={selectedFileNames.length > 0 ? `Delete these ${selectedFileNames.length} files` : ''}
                onClick={handleDelete}
            />
            &nbsp;
            <SmallIconButton
                icon={<DriveFileRenameOutline />}
                disabled={(selectedFileNames.length !== 1) || operating}
                title={selectedFileNames.length === 1? "Rename this file" : ''}
                onClick={handleRename}
            />
            &nbsp;
            <SmallIconButton
                icon={<FileCopy />}
                disabled={(selectedFileNames.length !== 1) || operating}
                title={selectedFileNames.length === 1? "Duplicate this file" : ''}
                onClick={handleDuplicate}
            />
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

export default FileBrowserMenuBar