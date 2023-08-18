import { Build } from "@mui/icons-material"
import { FunctionComponent, useMemo } from "react"
import { ProcessingToolSchema } from "../../types/neurobass-types"
import { useWorkspace } from "../WorkspacePage/WorkspacePageContext"
import './ProcessingTool.css'

type ProcessingToolsViewProps = {
    width: number
    height: number
}

const processingToolHeight = 220

const ProcessingToolsView: FunctionComponent<ProcessingToolsViewProps> = ({width, height}) => {
    const {computeResourceSpec} = useWorkspace()
    const processing_tools = computeResourceSpec?.processing_tools
    if (!processing_tools) return <div>Loading processing tools...</div>
    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <hr />
            {
                processing_tools.map((tool, i) => (
                    <span key={i}>
                        <ProcessingToolView
                            tool={tool}
                            width={width}
                            height={processingToolHeight}
                        />
                        <hr />
                    </span>
                ))
            }
        </div>
    )
}

type ProcessingToolViewProps = {
    tool: {name: string, attributes: any, schema: ProcessingToolSchema}
    width: number
    height: number
}

const ProcessingToolView: FunctionComponent<ProcessingToolViewProps> = ({tool, width, height}) => {
    const wipElmt = tool.attributes.wip ? <span style={{color: 'darkblue'}}> (WIP)</span> : null
    return (
        <div className="ProcessingTool" style={{position: 'relative', width: width - 20, height: height - 20, padding: 10, overflowY: 'auto'}}>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <div className="ProcessingToolImage" style={{width: 100,  marginRight: 10}}>
                    {
                        tool.attributes.logo_url ? (
                            <img src={tool.attributes.logo_url} style={{width: 100}} />
                        ) : (
                            <Build style={{paddingLeft: 10, paddingTop: 10, fontSize: 80}} />
                        )
                    }
                </div>
                <div className="ProcessingToolSecondColumn" style={{flex: 1}}>
                    <div className="ProcessingToolTitle">{tool.attributes.label || tool.name}{wipElmt}</div>
                    <div className="ProcessingToolDescription">{tool.schema.description}</div>
                    <div className="ProcessingToolParameters">
                        <ProcessingToolParametersView schema={tool.schema} />
                    </div>
                </div>
            </div>
        </div>
    )
}

type ProcessingToolParametersViewProps = {
    schema: ProcessingToolSchema
}

const ProcessingToolParametersView: FunctionComponent<ProcessingToolParametersViewProps> = ({schema}) => {
    const {inputs, outputs, parameters} = useMemo(() => {
        const inputs: {name: string, description: string}[] = []
        const outputs: {name: string, description: string}[] = []
        const parameters: {name: string, description: string}[] = []
        for (const k in schema.properties) {
            const p = schema.properties[k]
            if (p.type) {
                parameters.push({name: k, description: p.description || ''})
            }
            else if (p.allOf) {
                if (p.allOf[0]['$ref'] === '#/definitions/InputFile') {
                    inputs.push({name: k, description: p.description || ''})
                }
                else if (p.allOf[0]['$ref'] === '#/definitions/OutputFile') {
                    outputs.push({name: k, description: p.description || ''})
                }
                else {
                    parameters.push({name: k, description: p.description || ''})
                }
            }
        }
        return {inputs, outputs, parameters}
    }, [schema])
    return (
        <div style={{paddingLeft: 20}}>
            <div>
                {inputs.map((p, i) => <div key={i}>
                    {p.name} - {p.description}
                </div>)}
            </div>
            <div>
                {outputs.map((p, i) => <div key={i}>
                    {p.name} - {p.description}
                </div>)}
            </div>
            <div>
                {parameters.map((p, i) => <div key={i}>
                    {p.name} - {p.description}
                </div>)}
            </div>
        </div>
    )
}



export default ProcessingToolsView