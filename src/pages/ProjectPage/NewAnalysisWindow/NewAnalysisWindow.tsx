import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { useProject } from "../ProjectPageContext";

type Props = {
    onCreateFile: (fileName: string, fileContent: string) => void
}

const defaultNbaYaml = `
nba_type: 'mountainsort5'
recording_nwb_file: ""
recording_electrical_series_path: "/acquisition/ElectricalSeries"
`

const NewAnalysisWindow: FunctionComponent<Props> = ({onCreateFile}) => {
    const [newFileName, setNewFileName] = useState('')

    const {files} = useProject()

    const existingFileNames = useMemo(() => {
        if (!files) return undefined
        return files.map(f => f.fileName)
    }, [files])

    const fileExists = useMemo(() => {
        if (!newFileName) return false
        if (!existingFileNames) return true
        return existingFileNames.includes(newFileName)
    }, [newFileName, existingFileNames])

    const handleCreateFile = useCallback(() => {
        onCreateFile(newFileName, defaultNbaYaml)
    }, [newFileName, onCreateFile])

    useEffect(() => {
        if (!existingFileNames) return
        let i = 1
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const f = i === 1 ? `analysis.nba` : `analysis${i}.nba`
            if (!existingFileNames.includes(f)) {
                setNewFileName(f)
                return
            }
            i++
        }
    }, [existingFileNames])

    return (
        <div>
            <h3>Create a new analysis</h3>
            <hr />
            {/* Input field for the file name */}
            <div>
                <label htmlFor="new-file-name">File name:</label>
                &nbsp;
                <input type="text" id="new-file-name" value={newFileName} onChange={e => setNewFileName(e.target.value)} />
                {/* Indicator on whether the file name is valid */}
                &nbsp;&nbsp;
                {
                    isValidFileName(newFileName) ? (
                        <span style={{color: 'green'}}>
                            {/* Checkmark character */}
                            &#10004;
                        </span>
                    ) : (
                        <span style={{color: 'red'}}>
                            {/* Cross character */}
                            &#10008;
                        </span>
                    )
                }
                &nbsp;&nbsp;
                {
                    fileExists && (
                        <span style={{color: 'red'}}>
                            File already exists
                        </span>
                    )
                }
            </div>
            <hr />
            {/* Button to create the file */}
            <button disabled={!isValidFileName(newFileName)} onClick={handleCreateFile}>Create file</button>
        </div>
    )
}

const isValidFileName = (fileName: string) => {
    return fileName.endsWith('.nba')
}

export default NewAnalysisWindow