import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { useProject } from "../ProjectPageContext";

type Props = {
    onCreateFile: (fileName: string, fileContent: string) => void
}

const options = [
    {name: 'python-script', extension: '.py', label: 'Python script', defaultFileName: 'test.py', defaultText: ''},
    {name: 'markdown', extension: '.md', label: 'Markdown document', defaultFileName: 'description.md', defaultText: ''},
    {name: 'text', extension: '', label: 'Empty text file', defaultFileName: 'file.txt', defaultText: ''}
]

const NewFileWindow: FunctionComponent<Props> = ({onCreateFile}) => {
    const [selection, setSelection] = useState(options[0].name)
    const [newFileName, setNewFileName] = useState('')

    const {files} = useProject()

    const existingFileNames = useMemo(() => {
        if (!files) return []
        return files.map(f => f.fileName)
    }, [files])

    const fileExists = useMemo(() => {
        if (!newFileName) return false
        return existingFileNames.includes(newFileName)
    }, [newFileName, existingFileNames])

    const hasValidExtension = (fileName: string) => {
        const option = options.find(o => o.name === selection)
        if (!option) return false
        if (option.extension === '') return true
        return fileName.endsWith(option.extension)
    }

    const isValidFileName = (fileName: string) => {
        if (!fileName) return false
        if (!fileName.match(/^[a-zA-Z0-9_\-.]+$/)) return false
        if (fileExists) return false
        return hasValidExtension(fileName)
    }

    const selectedOption = useMemo(() => {
        return options.find(o => o.name === selection)
    }, [selection])

    useEffect(() => {
        if (!selectedOption) return
        setNewFileName(selectedOption.defaultFileName)
    }, [selectedOption])

    const handleCreateFile = useCallback(() => {
        if (!selectedOption) return
        const {defaultText} = selectedOption
        onCreateFile(newFileName, defaultText)
    }, [newFileName, onCreateFile, selectedOption])

    return (
        <div>
            <h3>Create a new file</h3>
            <p>
                Note: to import data from DANDI or other sources, use one of the options in the sidebar.
            </p>
            {
                // radio buttons for the various options
                options.map(({name, label}) => (
                    <div key={name}>
                        <input type="radio" name="new-file-type" id={`new-file-type-${name}`} checked={selection === name}
                            onChange={() => setSelection(name)}
                        />
                        <label htmlFor={`new-file-type-${name}`}>{label}</label>
                    </div>
                ))
            }
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

export default NewFileWindow