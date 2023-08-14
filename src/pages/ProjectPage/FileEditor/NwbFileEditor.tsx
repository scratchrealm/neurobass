import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import Hyperlink from "../../../components/Hyperlink";
import { fetchFile } from "../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { NBFile } from "../../../types/neurobass-types";
import { AssetResponse } from "../ImportNwbWindow/DandiNwbSelector/types";
import { useProject } from "../ProjectPageContext";


type Props = {
    fileName: string
    width: number
    height: number
}

type NwbLink = {
    url: string
    dandisetId?: string
    dandisetVersion?: string
    dandiAssetId?: string
    dandiAssetPath?: string
}

const NwbFileEditor: FunctionComponent<Props> = ({fileName, width, height}) => {
    const [assetResponse, setAssetResponse] = useState<AssetResponse | null>(null)

    const {projectId} = useProject()

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const [nbFile, setNBFile] = useState<NBFile | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        ; (async () => {
            const f = await fetchFile(projectId, fileName, auth)
            if (canceled) return
            setNBFile(f)
        })()
        return () => {canceled = true}
    }, [projectId, fileName, auth])

    const metadata = nbFile?.metadata
    const cc = nbFile?.content || ''
    const nwbUrl = cc.startsWith('url:') ? cc.slice('url:'.length) : ''


    const dandisetId = metadata?.dandisetId || ''
    const dandisetVersion = metadata?.dandisetVersion || ''
    const dandiAssetId = metadata?.dandiAssetId || ''
    const dandiAssetPath = metadata?.dandiAssetPath || ''

    const handleOpenInNeurosift = useCallback(() => {
        const u = `https://flatironinstitute.github.io/neurosift/?p=/nwb&url=${nwbUrl}`
        window.open(u, '_blank')
    }, [nwbUrl])

    useEffect(() => {
        if (!dandisetId) return
        if (!dandiAssetId) return
        ; (async () => {
            const response = await fetch(`https://api.dandiarchive.org/api/dandisets/${dandisetId}/versions/${dandisetVersion}/assets/${dandiAssetId}/`)
            if (response.status === 200) {
                const json = await response.json()
                const assetResponse: AssetResponse = json
                setAssetResponse(assetResponse)
            }
        })()
    }, [dandisetId, dandiAssetId, dandisetVersion])

    if ((assetResponse) && (dandiAssetPath !== assetResponse.path)) {
        console.warn(`Mismatch between dandiAssetPath (${dandiAssetPath}) and assetResponse.path (${assetResponse.path})`)
    }

    return (
        <div style={{position: 'absolute', width, height, background: 'white'}}>
            <hr />
            <table className="table1">
                <tbody>
                    <tr>
                        <td>URL:</td>
                        <td>{nwbUrl}</td>
                    </tr>
                    <tr>
                        <td>Dandiset:</td>
                        <td>
                            {dandisetId && <a href={`https://dandiarchive.org/dandiset/${dandisetId}/${dandisetVersion}`} target="_blank" rel="noreferrer">
                                {dandisetId} ({dandisetVersion || ''})
                            </a>}
                        </td>
                    </tr>
                    <tr>
                        <td>Path:</td>
                        <td>
                            {assetResponse?.path || ''}
                        </td>
                    </tr>
                    <tr>

                    </tr>
                </tbody>
            </table>
            <div>&nbsp;</div>
            {
                nwbUrl && (
                    <div>
                        <Hyperlink onClick={handleOpenInNeurosift}>Open in Neurosift</Hyperlink>
                    </div>
                )
            }
            <hr />
        </div>
    )
}

export default NwbFileEditor