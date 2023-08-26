import { Build } from "@mui/icons-material"
import { FunctionComponent, useMemo } from "react"
import { ProcessingToolSchema } from "../../types/neurobass-types"
import { useWorkspace } from "../WorkspacePage/WorkspacePageContext"
import './ProcessingTool.css'

type ProcessingToolsViewProps = {
    width: number
    height: number
}

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
                        />
                        <hr />
                    </span>
                ))
            }
        </div>
    )
}

type ProcessingToolViewProps = {
    tool: {name: string, attributes: any, tags: string[], schema: ProcessingToolSchema}
    width: number
}

const ProcessingToolView: FunctionComponent<ProcessingToolViewProps> = ({tool, width}) => {
    const wipElmt = tool.attributes.wip ? <span style={{color: 'darkblue'}}> (WIP)</span> : null
    return (
        <div className="ProcessingTool" style={{position: 'relative', width: width - 20, padding: 10, overflowY: 'auto'}}>
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
                    <div>&nbsp;</div>
                    <div className="ProcessingToolParameters">
                        <ProcessingToolParametersView schema={tool.schema} />
                    </div>
                    <div>&nbsp;</div>
                    <div className="ProcessingToolTags">
                        |&nbsp;{(tool.tags || []).map((tag, i) => <span key={i} className="ProcessingToolTag">{tag}&nbsp;|&nbsp;</span>)}
                    </div>
                </div>
            </div>
        </div>
    )
}

type ProcessingToolParametersViewProps = {
    schema: ProcessingToolSchema
}

export type ProcessingToolSchemaParameter = {
    name: string
    type: string
    description?: string
    default?: any
    group?: string
    choices?: (string | number)[]
}

export class ProcessingToolSchemaParser {
    #inputs: {name: string, description: string}[] = []
    #outputs: {name: string, description: string}[] = []
    #parameters: ProcessingToolSchemaParameter[] = []
    constructor(private schema: ProcessingToolSchema) {
        for (const p of schema.properties) {
            if (p.type === 'InputFile') {
                this.#inputs.push({name: p.name, description: p.description || ''})
            }
            else if (p.type === 'OutputFile') {
                this.#outputs.push({name: p.name, description: p.description || ''})
            }
            else {
                this.#parameters.push({name: p.name, description: p.description || '', type: p.type, default: p.default, group: p.group, choices: p.choices})
            }
        }
    }
    get inputs() {
        return this.#inputs
    }
    get outputs() {
        return this.#outputs
    }
    get parameters() {
        return this.#parameters
    }
}

const ProcessingToolParametersView: FunctionComponent<ProcessingToolParametersViewProps> = ({schema}) => {
    const S = useMemo(() => (new ProcessingToolSchemaParser(schema)), [schema])
    return (
        <div>
            <div>
                {S.inputs.map((p, i) => <div key={i}>
                    {p.name} - {p.description}
                </div>)}
            </div>
            <div>
                {S.outputs.map((p, i) => <div key={i}>
                    {p.name} - {p.description}
                </div>)}
            </div>
            <div>
                {S.parameters.map((p, i) => <div key={i}>
                    {p.name} - {p.description}
                </div>)}
            </div>
        </div>
    )
}



export default ProcessingToolsView