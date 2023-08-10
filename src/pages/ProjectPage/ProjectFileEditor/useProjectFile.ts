import { useCallback, useEffect, useMemo, useState } from "react"
import { deleteProjectFile, fetchProjectFile, fetchDataBlob, setProjectFileContent } from "../../../dbInterface/dbInterface"
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth"

// this file to be deleted

const useProjectFile = (workspaceId: string, projectId: string, fileName: string) => {
    const [refreshCode, setRefreshCode] = useState<number>(0)
    const [fileContent, setFileContent] = useState<string | undefined>(undefined)

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    useEffect(() => {
        let canceled = false
        setFileContent(undefined)
        ;(async () => {
            if (!projectId) return
            const af = await fetchProjectFile(projectId, fileName, auth)
            if (canceled) return
            if (!af) return
            const x = await fetchDataBlob(af.workspaceId, projectId, af.contentSha1, auth)
            setFileContent(x)
        })()
        return () => {
            canceled = true
        }
    }, [projectId, fileName, refreshCode, auth])

    const setFileContentHandler = useCallback(async (fileContent: string) => {
        if (!workspaceId) {
            console.warn('No workspace ID')
            return
        }
        await setProjectFileContent(workspaceId, projectId, fileName, fileContent, auth)
        setRefreshCode(rc => rc + 1)
    }, [workspaceId, projectId, fileName, auth])

    const deleteFileHandler = useMemo(() => (async () => {
        if (!workspaceId) {
            console.warn('No workspace ID')
            return
        }
        await deleteProjectFile(workspaceId, projectId, fileName, auth)
    }), [workspaceId, projectId, fileName, auth])

    return {
        fileContent,
        setFileContent: setFileContentHandler,
        deleteFile: deleteFileHandler
    }
}

export default useProjectFile