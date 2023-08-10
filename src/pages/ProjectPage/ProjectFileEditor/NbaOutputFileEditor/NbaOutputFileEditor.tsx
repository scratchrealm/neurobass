import { FunctionComponent, useMemo } from "react";
import Hyperlink from "../../../../components/Hyperlink";
import { useProject } from "../../ProjectPageContext";
import ChainsTable from "./ChainsTable";
import ExportComponent from "./ExportComponent";

type Props = {
    fileName: string
    fileContent: string
    width: number
    height: number
}

export type NbaOutput = {
    chains: {
        chainId: string,
        rawHeader: string,
        rawFooter: string,
        numWarmupDraws?: number,
        sequences: {
            [key: string]: number[]
        },
        variablePrefixesExcluded?: string[]
    }[]
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

    const {projectId} = useProject()
    const mcmcMonitorUrl = `https://flatironinstitute.github.io/mcmc-monitor?s=spa#/spa/${projectId}/${fileName}`
    // const mcmcMonitorUrl = `http://localhost:5173/mcmc-monitor?s=spa#/spa/${projectId}/${fileName}`

    return (
        <div style={{position: 'absolute', width, height, background: 'white'}}>
            <div style={{padding: 10}}>
                <h3>{fileName}</h3>
                <div><Hyperlink href={mcmcMonitorUrl} target="_blank">View in MCMC Monitor</Hyperlink></div>
                <hr />
                <ChainsTable NbaOutput={NbaOutput} />
                <hr />
                <ExportComponent NbaOutput={NbaOutput} /> 
            </div>
        </div>
    )
}

export default NbaOutputFileEditor