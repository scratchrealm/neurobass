import { AutoFixHigh, Chat } from "@mui/icons-material";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import Hyperlink from "../../../components/Hyperlink";
import Splitter from "../../../components/Splitter";
import runStanc from "./runStanc";
import StanCompileResultWindow from "./StanCompileResultWindow";
import TextEditor, { ToolbarItem } from "./TextEditor";


type Props = {
    fileName: string
    fileContent: string
    onSaveContent: (text: string) => void
    editedFileContent: string
    setEditedFileContent: (text: string) => void
    readOnly: boolean
    width: number
    height: number
}

const NwbFileEditor: FunctionComponent<Props> = ({fileName, fileContent, onSaveContent, editedFileContent, setEditedFileContent, readOnly, width, height}) => {
    const content = useMemo(() => {
        try {
            return JSON.parse(fileContent)
        }
        catch {
            return {}
        }
    }, [])

    const nwbUrl = content.url || ''

    const handleOpenInNeurosift = useCallback(() => {
        const u = `https://flatironinstitute.github.io/neurosift/?p=/nwb&url=${nwbUrl}`
        window.open(u, '_blank')
    }, [nwbUrl])

    return (
        <div style={{position: 'absolute', width, height, background: 'white'}}>
            <hr />
            <table>
                <tbody>
                    <tr>
                        <td>URL:</td>
                        <td>{nwbUrl}</td>
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