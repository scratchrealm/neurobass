import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { useModalDialog } from "../../../ApplicationBar";
import Hyperlink from "../../../components/Hyperlink";
import ModalWindow from "../../../components/ModalWindow/ModalWindow";
import Splitter from "../../../components/Splitter";
import { fetchFile } from "../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { NBFile } from "../../../types/neurobass-types";
import { AssetResponse } from "../ImportNwbWindow/DandiNwbSelector/types";
import JobsWindow from "../JobsWindow/JobsWindow";
import { useProject } from "../ProjectPageContext";
import RunSpikeSortingWindow from "./RunSpikeSortingWindow/RunSpikeSortingWindow";


type Props = {
    fileName: string
    width: number
    height: number
}

const NwbFileEditor: FunctionComponent<Props> = ({fileName, width, height}) => {
    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={height * 2 / 3}
            direction="vertical"
        >
            <NwbFileEditorChild
                width={0}
                height={0}
                fileName={fileName}
            />
            <JobsWindow
                width={0}
                height={0}
                fileName={fileName}
            />
        </Splitter>
    )
}

const NwbFileEditorChild: FunctionComponent<Props> = ({fileName, width, height}) => {
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

    const {visible: runSpikeSortingWindowVisible, handleOpen: openRunSpikeSortingWindow, handleClose: closeRunSpikeSortingWindow} = useModalDialog()
    const handleRunSpikeSorting = useCallback(() => {
        openRunSpikeSortingWindow()
    }, [openRunSpikeSortingWindow])

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
            <div>&nbsp;</div>
            {
                nwbUrl && (
                    <div>
                        <Hyperlink onClick={handleRunSpikeSorting}>Run spike sorting</Hyperlink>
                    </div>
                )
            }
            <hr />
            <ModalWindow
                open={runSpikeSortingWindowVisible}
                onClose={closeRunSpikeSortingWindow}
            >
                <RunSpikeSortingWindow
                    onClose={closeRunSpikeSortingWindow}
                    fileName={fileName}
                />
            </ModalWindow>
        </div>
    )
}

export default NwbFileEditor