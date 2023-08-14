import { FunctionComponent, useMemo } from "react";
import Hyperlink from "../../../../components/Hyperlink";

type Props = {
    fileName: string
    fileContent: string
    width: number
    height: number
}

export type NbaOutput = {
    sorting_nwb_file: string
}

const NbaOutputFileEditor: FunctionComponent<Props> = ({fileName, fileContent, width, height}) => {
    const NbaOutput = useMemo(() => {
        if (!fileContent) return undefined
        try {
            return JSON.parse(fileContent) as NbaOutput
        }
        catch (e) {
            console.warn(`Problem parsing nba output file ${fileName}`)
            return undefined
        }
    }, [fileContent, fileName])

    const handleOpenInNeurosift = () => {
        const url = NbaOutput?.sorting_nwb_file
        if (!url) return
        const u = `https://flatironinstitute.github.io/neurosift/?p=/nwb&url=${url}`
        window.open(u, '_blank')
    }

    return (
        <div style={{position: 'absolute', width, height, background: 'white'}}>
            <div style={{padding: 10}}>
                <h3>{fileName}</h3>
                <table>
                    <tbody>
                        <tr>
                            <td>Sorting output:</td>
                            <td>{NbaOutput?.sorting_nwb_file}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div style={{padding: 10}}>
                {
                    NbaOutput?.sorting_nwb_file && (
                        <Hyperlink onClick={handleOpenInNeurosift}>
                            Open in Neurosift
                        </Hyperlink>
                    )
                }
            </div>
        </div>
    )
}

export default NbaOutputFileEditor