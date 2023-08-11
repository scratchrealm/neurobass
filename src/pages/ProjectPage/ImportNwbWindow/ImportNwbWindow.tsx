import { Button } from "@mui/material";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import Hyperlink from "../../../components/Hyperlink";
import DandiNwbSelector from "./DandiNwbSelector";
import './table-x.css'

type Props = {
    onCreateFile: (fileName: string, fileContent: string) => void
}

const ImportNwbWindow: FunctionComponent<Props> = ({onCreateFile}) => {
    const [dandisetId, setDandisetId] = useState<string>('')
    const [dandisetVersion, setDandisetVersion] = useState<string>('')
    const [dandiAssetId, setDandiAssetId] = useState<string>('')
    const [fileName, setFileName] = useState<string>('file.nwb')
    const [nwbUrl, setNwbUrl] = useState<string>('')
    const handleSubmit = useCallback(() => {
        const a = {
            url: nwbUrl,
            dandisetId: dandisetId || undefined,
            dandisetVersion: dandisetVersion || undefined,
            dandiAssetId: dandiAssetId || undefined
        }
        onCreateFile(fileName, JSON.stringify(a, null, 2))
    }, [nwbUrl, fileName, onCreateFile, dandisetId, dandiAssetId, dandisetVersion])

    const [dandiArchiveExpanded, setDandiArchiveExpanded] = useState<boolean>(false)

    const submitEnabled = useMemo(() => {
        if (!fileName) return false
        if (!nwbUrl) return false
        if (!fileName.endsWith('.nwb')) return false
        if ((!nwbUrl.startsWith('https://')) && (!nwbUrl.startsWith('http://'))) return false
        return true
    }, [fileName, nwbUrl])

    const [mode, setMode] = useState<'manual' | 'dandi'>('dandi')

    const handleDandiNwbSelected = useCallback((nwbUrl: string, dandisetId: string, dandisetVersion: string, assetId: string) => {
        setNwbUrl(nwbUrl)
        setDandisetId(dandisetId)
        setDandisetVersion(dandisetVersion)
        setDandiAssetId(assetId)
        setMode('manual')
    }, [])

    return (
        <div>
            <p>
                {/* Radio boxes for selecting manual or dandi mode */}
                <input type="radio" id="manual" name="mode" value="manual" checked={mode === 'manual'} onChange={e => setMode('manual')} />
                <label htmlFor="manual">Manual import</label>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <input type="radio" id="dandi" name="mode" value="dandi" checked={mode === 'dandi'} onChange={e => setMode('dandi')} />
                <label htmlFor="dandi">DANDI import</label>
            </p>
            <hr />
            {
                mode === 'manual' ? (
                    <table className="table-x" style={{padding: 10}}>
                        <tbody>
                            <tr>
                                <td>Name of new file in Neurobass:</td>
                                <td>
                                    <input type="text" style={{width: 500}} value={fileName} onChange={e => setFileName(e.target.value)} />
                                </td>
                            </tr>
                            <tr>
                                <td>Bucket URL:</td>
                                <td>
                                    <input type="text" style={{width: 500}} value={nwbUrl} onChange={e => setNwbUrl(e.target.value)} />
                                </td>
                            </tr>
                            <tr>
                                <td>Dandiset ID (optional):</td>
                                <td>
                                    <input type="text" style={{width: 500}} value={dandisetId} onChange={e => setDandisetId(e.target.value)} />
                                </td>
                            </tr>
                            <tr>
                                <td>Dandiset version (optional):</td>
                                <td>
                                    <input type="text" style={{width: 500}} value={dandisetVersion} onChange={e => setDandisetVersion(e.target.value)} />
                                </td>
                            </tr>
                            <tr>
                                <td>DANDI asset ID (optional):</td>
                                <td>
                                    <input type="text" style={{width: 500}} value={dandiAssetId} onChange={e => setDandiAssetId(e.target.value)} />
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2}>
                                    <hr />
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2}>
                                    <Button variant="contained" onClick={handleSubmit} disabled={!submitEnabled}>Import</Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : mode === 'dandi' ? (
                    <DandiNwbSelector onNwbFileSelected={handleDandiNwbSelected} />
                ) : <span />
            }
            <hr />
            {
                dandiArchiveExpanded ? (
                    <iframe width="100%" height="1000px" src="https://dandiarchive.org" />
                ) : (
                    <Hyperlink>
                        <span onClick={() => setDandiArchiveExpanded(true)}>View DANDI Archive</span>
                    </Hyperlink>
                )
            }
        </div>
    )
}

export default ImportNwbWindow