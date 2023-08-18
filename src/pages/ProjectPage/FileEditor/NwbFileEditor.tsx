import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { useModalDialog } from "../../../ApplicationBar";
import Hyperlink from "../../../components/Hyperlink";
import ModalWindow from "../../../components/ModalWindow/ModalWindow";
import Splitter from "../../../components/Splitter";
import { fetchFile } from "../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { getRemoteH5File, RemoteH5File } from "../../../RemoteH5File/RemoteH5File";
import { NBFile } from "../../../types/neurobass-types";
import { useWorkspace } from "../../WorkspacePage/WorkspacePageContext";
import { AssetResponse } from "../DandiNwbSelector/types";
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

const useNwbFile = (nwbUrl: string) => {
    const [nwbFile, setNwbFile] = useState<RemoteH5File | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        ; (async () => {
            const f = await getRemoteH5File(nwbUrl, undefined)
            if (canceled) return
            setNwbFile(f)
        })()
        return () => {canceled = true}
    }, [nwbUrl])
    return nwbFile
}

export const useElectricalSeriesPaths = (nwbFile: RemoteH5File | undefined) => {
    const [electricalSeriesPaths, setElectricalSeriesPaths] = useState<string[] | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        setElectricalSeriesPaths(undefined)
        ; (async () => {
            if (!nwbFile) return
            const grp = await nwbFile.getGroup('acquisition')
            if (canceled) return
            if (!grp) return
            const pp: string[] = []
            for (const sg of grp.subgroups) {
                if (sg.attrs['neurodata_type'] === 'ElectricalSeries') {
                    pp.push(sg.path)
                }
            }
            setElectricalSeriesPaths(pp)
        })()
        return () => {canceled = true}
    }, [nwbFile])
    return electricalSeriesPaths
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
    const nwbFile = useNwbFile(nwbUrl)
    const electricalSeriesPaths = useElectricalSeriesPaths(nwbFile)

    const dandisetId = metadata?.dandisetId || ''
    const dandisetVersion = metadata?.dandisetVersion || ''
    const dandiAssetId = metadata?.dandiAssetId || ''
    const dandiAssetPath = metadata?.dandiAssetPath || ''
    const dandiStaging = metadata?.dandiStaging || false

    const stagingStr = dandiStaging ? '-staging' : ''
    const stagingStr2 = dandiStaging ? 'gui-staging.' : ''

    const handleOpenInNeurosift = useCallback(() => {
        const u = `https://flatironinstitute.github.io/neurosift/?p=/nwb&url=${nwbUrl}`
        window.open(u, '_blank')
    }, [nwbUrl])

    useEffect(() => {
        if (!dandisetId) return
        if (!dandiAssetId) return
        ; (async () => {
            const response = await fetch(`https://api${stagingStr}.dandiarchive.org/api/dandisets/${dandisetId}/versions/${dandisetVersion}/assets/${dandiAssetId}/`)
            if (response.status === 200) {
                const json = await response.json()
                const assetResponse: AssetResponse = json
                setAssetResponse(assetResponse)
            }
        })()
    }, [dandisetId, dandiAssetId, dandisetVersion, stagingStr])

    if ((assetResponse) && (dandiAssetPath !== assetResponse.path)) {
        console.warn(`Mismatch between dandiAssetPath (${dandiAssetPath}) and assetResponse.path (${assetResponse.path})`)
    }

    const {visible: runSpikeSortingWindowVisible, handleOpen: openRunSpikeSortingWindow, handleClose: closeRunSpikeSortingWindow} = useModalDialog()
    const [selectedSpikeSortingTool, setSelectedSpikeSortingTool] = useState<string | undefined>(undefined)

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
                            {dandisetId && <a href={`https://${stagingStr2}dandiarchive.org/dandiset/${dandisetId}/${dandisetVersion}`} target="_blank" rel="noreferrer">
                                {dandisetId} ({dandisetVersion || ''})
                            </a>}
                        </td>
                    </tr>
                    <tr>
                        <td>DANDI Path:</td>
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
                electricalSeriesPaths && (
                    electricalSeriesPaths.length > 0 ? (
                        <RunSpikeSortingComponent
                            onSelect={(toolName) => {setSelectedSpikeSortingTool(toolName); openRunSpikeSortingWindow();}}
                        />
                    ) : (
                        <div>No electrical series found</div>
                    )       
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
                    spikeSortingToolName={selectedSpikeSortingTool}
                    nwbFile={nwbFile}
                />
            </ModalWindow>
        </div>
    )
}

type RunSpikeSortingComponentProps = {
    onSelect?: (toolName: string) => void
}

const RunSpikeSortingComponent: FunctionComponent<RunSpikeSortingComponentProps> = ({onSelect}) => {
    const {computeResourceSpec} = useWorkspace()
    if (!computeResourceSpec) return <div>Loading compute resource spec...</div>
    const spikeSorterTools = computeResourceSpec.processing_tools.filter(t => (t.tags || []).includes('spike_sorter'))
    if (spikeSorterTools.length === 0) return <div>No spike sorter tools found</div>
    return (
        <div>
            Run spike sorting using:
            <ul>
                {
                    spikeSorterTools.map((tool, i) => (
                        <li key={i}>
                            <Hyperlink onClick={() => {onSelect && onSelect(tool.name)}}>
                                {tool.attributes.label || tool.name}
                            </Hyperlink>
                        </li>
                    ))
                }
            </ul>
        </div>
    )
}

export default NwbFileEditor