import { FunctionComponent, useCallback, useMemo, useState } from "react";

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
                In the future, it will be easier to import direct from DANDI Archive.
            </p>
            <hr />
            <p>
                Enter the name of the file to create:
            </p>
            <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} />
            <p>
                Enter the bucket URL of the NWB file you want to import:
            </p>
            <input type="text" value={nwbUrl} onChange={e => setNwbUrl(e.target.value)} />
            <p>
                <button onClick={handleSubmit} disabled={!submitEnabled}>Import</button>
            </p>
        </div>
    )
}

export default ImportNwbWindow