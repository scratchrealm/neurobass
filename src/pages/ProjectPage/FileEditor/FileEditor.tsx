import { FunctionComponent, useCallback, useEffect, useMemo } from "react";
import { fetchFile, fetchFileText, setFileText } from "../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { useProject } from "../ProjectPageContext";
import NwbFileEditor from "./NwbFileEditor";
import ScriptFileEditor from "./ScriptFileEditor";
import StanFileEditor from "./StanFileEditor";
import TextFileEditor from "./TextFileEditor";

type Props = {
    fileName: string
    readOnly: boolean
    fileContent?: string
    setFileContent: (content: string | undefined) => void
    editedFileContent?: string
    setEditedFileContent: (content: string) => void
    width: number
    height: number
}

const FileEditor: FunctionComponent<Props> = ({fileName, readOnly, fileContent, setFileContent, editedFileContent, setEditedFileContent, width, height}) => {
    const {projectId, workspaceId} = useProject()

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    useEffect(() => {
        // initial setting of edited content
        if (editedFileContent !== undefined) return // already set initially
        if (fileContent === undefined) return
        setEditedFileContent(fileContent)
    }, [fileContent, editedFileContent, setEditedFileContent])

    useEffect(() => {
        // loading of file content
        let canceled = false
        if (fileContent !== undefined) return
        ;(async () => {
            const pf = await fetchFile(projectId, fileName, auth)
            if (canceled) return
            if (!pf) {
                setFileContent(undefined)
                return
            }
            if (pf.content.startsWith('url:')) {
                setFileContent(undefined)
            }
            else {
                const txt = await fetchFileText(pf, auth)
                if (canceled) return
                setFileContent(txt || '')
            }
        })()
        return () => {canceled = true}
    }, [fileName, projectId, workspaceId, fileContent, setFileContent, auth])

    const handleSaveContent = useCallback(async (text: string) => {
        let canceled = false
        ;(async () => {
            await setFileText(workspaceId, projectId, fileName, text, auth)
            if (canceled) return
            setFileContent(undefined) // trigger reloading
        })()
        return () => {canceled = true}
    }, [auth, workspaceId, projectId, fileName, setFileContent])

    if (fileName.endsWith('.stan')) {
        return (
            <StanFileEditor
                fileName={fileName}
                fileContent={fileContent || ''}
                onSaveContent={handleSaveContent}
                editedFileContent={editedFileContent || ''}
                setEditedFileContent={setEditedFileContent}
                readOnly={readOnly}
                width={width}
                height={height}
            />
        )
    }
    else if (fileName.endsWith('.py')) {
        return (
            <ScriptFileEditor
                fileName={fileName}
                fileContent={fileContent || ''}
                onSaveContent={handleSaveContent}
                editedFileContent={editedFileContent || ''}
                setEditedFileContent={setEditedFileContent}
                readOnly={readOnly}
                width={width}
                height={height}
            />
        )
    }
    else if (fileName.endsWith('.nwb')) {
        return (
            <NwbFileEditor
                fileName={fileName}
                width={width}
                height={height}
            />
        )
    }
    else {
        return (
            <TextFileEditor
                fileName={fileName}
                fileContent={fileContent || ''}
                onSaveContent={handleSaveContent}
                editedFileContent={editedFileContent || ''}
                setEditedFileContent={setEditedFileContent}
                readOnly={readOnly}
                width={width}
                height={height}
            />
        )
    }
}

export default FileEditor