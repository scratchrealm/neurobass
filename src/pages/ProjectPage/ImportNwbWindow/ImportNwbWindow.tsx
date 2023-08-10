import { Button } from "@mui/material";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import Hyperlink from "../../../components/Hyperlink";
import './table-x.css'

type Props = {
    onCreateFile: (fileName: string, fileContent: string) => void
}

const ImportNwbWindow: FunctionComponent<Props> = ({onCreateFile}) => {
    const [fileName, setFileName] = useState<string>('file.nwb')
    const [nwbUrl, setNwbUrl] = useState<string>('')
    const handleSubmit = useCallback(() => {
        const a = {
            url: nwbUrl
        }
        onCreateFile(fileName, JSON.stringify(a, null, 2))
    }, [nwbUrl, fileName, onCreateFile])

    const [dandiArchiveExpanded, setDandiArchiveExpanded] = useState<boolean>(false)

    const submitEnabled = useMemo(() => {
        if (!fileName) return false
        if (!nwbUrl) return false
        if (!fileName.endsWith('.nwb')) return false
        if ((!nwbUrl.startsWith('https://')) && (!nwbUrl.startsWith('http://'))) return false
        return true
    }, [fileName, nwbUrl])

    return (
        <div>
            <p>
                In the future, it will be easier to import direct from DANDI Archive with mouse clicks. For now, you have to manually copy the S3 URL and paste it into the field below.
            </p>
            <hr />
            <table className="table-x" style={{padding: 10}}>
                <tbody>
                    <tr>
                        <td>
                            Name of new file in Neurobass:
                        </td>
                        <td>
                            <input type="text" style={{width: 500}} value={fileName} onChange={e => setFileName(e.target.value)} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Bucket URL:
                        </td>
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