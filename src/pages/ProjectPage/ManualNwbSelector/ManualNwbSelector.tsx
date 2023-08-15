import { Button } from "@mui/material";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import './table-x.css';

type Props = {
    width: number
    height: number
    onNwbFileSelected: (nwbUrl: string, fileName: string) => void
}

const ManualNwbSelector: FunctionComponent<Props> = ({width, height, onNwbFileSelected}) => {
    const [fileName, setFileName] = useState<string>('file.nwb')
    const [nwbUrl, setNwbUrl] = useState<string>('')
    const handleSubmit = useCallback(() => {
        onNwbFileSelected(nwbUrl, fileName)
    }, [nwbUrl, fileName, onNwbFileSelected])

    const submitEnabled = useMemo(() => {
        if (!fileName) return false
        if (!nwbUrl) return false
        if (!fileName.endsWith('.nwb')) return false
        if ((!nwbUrl.startsWith('https://')) && (!nwbUrl.startsWith('http://'))) return false
        return true
    }, [fileName, nwbUrl])

    return (
        <div style={{position: 'absolute', width, height, overflow: 'hidden'}}>
            <table className="table-x" style={{padding: 10}}>
                <tbody>
                    <tr>
                        <td>Name of new file in Neurobass:</td>
                        <td>
                            <input type="text" style={{width: 500}} value={fileName} onChange={e => setFileName(e.target.value)} />
                        </td>
                    </tr>
                    <tr>
                        <td>NWB URL:</td>
                        <td>
                            <input type="text" style={{width: 500}} value={nwbUrl} onChange={e => setNwbUrl(e.target.value)} />
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
        </div>
    )
}

export default ManualNwbSelector