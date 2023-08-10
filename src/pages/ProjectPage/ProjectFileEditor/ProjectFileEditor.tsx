import { FunctionComponent, useCallback, useEffect, useMemo } from "react";
import { fetchDataBlob, fetchProjectFile, setProjectFileContent } from "../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { useProject } from "../ProjectPageContext";
import ScriptFileEditor from "./ScriptFileEditor";
import NbaOutputFileEditor from "./NbaOutputFileEditor/NbaOutputFileEditor";
import StanFileEditor from "./StanFileEditor";
import TextFileEditor from "./TextFileEditor";
import NwbFileEditor from "./NwbFileEditor";

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

const ProjectFileEditor: FunctionComponent<Props> = ({fileName, readOnly, fileContent, setFileContent, editedFileContent, setEditedFileContent, width, height}) => {
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
            const pf = await fetchProjectFile(projectId, fileName, auth)
            if (canceled) return
            const sha1 = pf?.contentSha1
            if (!sha1) return
            const txt = await fetchDataBlob(workspaceId, projectId, sha1, auth)
            if (canceled) return
            setFileContent(txt || '')
        })()
        return () => {canceled = true}
    }, [fileName, projectId, workspaceId, fileContent, setFileContent, auth])

    const handleSaveContent = useCallback(async (text: string) => {
        let canceled = false
        ;(async () => {
            await setProjectFileContent(workspaceId, projectId, fileName, text, auth)
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
    else if (fileName.endsWith('.py') || fileName.endsWith('.nba')) {
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
    else if (fileName.endsWith('.nba.out')) {
        return (
            <NbaOutputFileEditor
                fileName={fileName}
                fileContent={fileContent || ''}
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

export default ProjectFileEditor