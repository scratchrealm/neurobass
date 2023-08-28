import { FunctionComponent, useCallback, useEffect, useMemo } from "react";
import { NBProcessingJobDefinition } from "../../../../dbInterface/dbInterface";
import { RemoteH5File } from "../../../../RemoteH5File/RemoteH5File";
import { ProcessingToolSchema } from "../../../../types/neurobass-types";
import { ProcessingToolSchemaParameter, ProcessingToolSchemaParser } from "../../ProcessingToolsView";
import { useElectricalSeriesPaths } from "../NwbFileEditor";

type EditJobDefinitionWindowProps = {
    jobDefinition: NBProcessingJobDefinition | undefined
    setJobDefinition: (jobDefinition: NBProcessingJobDefinition | undefined) => void
    processingTool: {
        name: string
        attributes: any
        tags: string[]
        schema: ProcessingToolSchema
    }
    nwbFile?: RemoteH5File
}

const EditJobDefinitionWindow: FunctionComponent<EditJobDefinitionWindowProps> = ({jobDefinition, setJobDefinition, processingTool, nwbFile}) => {
    const pt = useMemo(() => (new ProcessingToolSchemaParser(processingTool.schema)), [processingTool.schema])
    const setParameterValue = useCallback((name: string, value: any) => {
        if (!jobDefinition) return
        const newJobDefinition: NBProcessingJobDefinition = {
            ...jobDefinition,
            inputParameters: jobDefinition.inputParameters.map(p => {
                if (p.name === name) {
                    return {
                        ...p,
                        value
                    }
                }
                else return p
            })
        }
        setJobDefinition(newJobDefinition)
    }, [jobDefinition, setJobDefinition])
    const rows = useMemo(() => {
        const ret: any[] = []
        pt.inputs.forEach(input => {
            ret.push(
                <InputRow
                    key={input.name}
                    name={input.name}
                    description={input.description}
                    value={jobDefinition?.inputFiles.find(f => (f.name === input.name))?.fileName}
                />
            )
        })
        pt.outputs.forEach(output => {
            ret.push(
                <OutputRow
                    key={output.name}
                    name={output.name}
                    description={output.description}
                    value={jobDefinition?.outputFiles.find(f => (f.name === output.name))?.fileName}
                />
            )
        })
        pt.parameters.forEach(parameter => {
            ret.push(
                <ParameterRow
                    key={parameter.name}
                    parameter={parameter}
                    value={jobDefinition?.inputParameters.find(f => (f.name === parameter.name))?.value}
                    nwbFile={nwbFile}
                    setValue={value => {
                        setParameterValue(parameter.name, value)
                    }}
                />
            )
        })
        return ret
    }, [pt, jobDefinition, nwbFile, setParameterValue])
    return (
        <div>
            <table className="table1">
                <tbody>
                    {rows}
                </tbody>
            </table>
        </div>
    )
}

type InputRowProps = {
    name: string
    description: string
    value?: string
}

const InputRow: FunctionComponent<InputRowProps> = ({name, description, value}) => {
    return (
        <tr>
            <td>{name}</td>
            <td>{value}</td>
            <td>{description}</td>
        </tr>
    )
}

type OutputRowProps = {
    name: string
    description: string
    value?: string
}

const OutputRow: FunctionComponent<OutputRowProps> = ({name, description, value}) => {
    return (
        <tr>
            <td>{name}</td>
            <td>{value}</td>
            <td>{description}</td>
        </tr>
    )
}

type ParameterRowProps = {
    parameter: ProcessingToolSchemaParameter
    value?: string
    nwbFile?: RemoteH5File
    setValue: (value: any) => void
}

const ParameterRow: FunctionComponent<ParameterRowProps> = ({parameter, value, nwbFile, setValue}) => {
    const {type, name, description} = parameter
    return (
        <tr>
            <td title={`${name} (${type})`}>{name}</td>
            <td>
                <EditParameterValue
                    parameter={parameter}
                    value={value}
                    nwbFile={nwbFile}
                    setValue={setValue}
                />
            </td>
            <td>{description}</td>
        </tr>
    )
}

type EditParameterValueProps = {
    parameter: ProcessingToolSchemaParameter
    value?: string
    nwbFile?: RemoteH5File
    setValue: (value: any) => void
}

const EditParameterValue: FunctionComponent<EditParameterValueProps> = ({parameter, value, nwbFile, setValue}) => {
    const {type, name} = parameter
    if (name === 'electrical_series_path') {
        return <ElectricalSeriesPathSelector value={value} nwbFile={nwbFile} setValue={setValue} />
    }
    else if (type === 'str') {
        return <input type="text" value={value} onChange={evt => {setValue(evt.target.value)}} />
    }
    else if (type === 'int') {
        return <input type="number" value={value} onChange={evt => {setValue(evt.target.value)}} />
    }
    else if (type === 'float') {
        return <input type="number" value={value} onChange={evt => {setValue(evt.target.value)}} />
    }
    else if (type === 'bool') {
        return <input type="checkbox" checked={value === 'true'} onChange={evt => {setValue(evt.target.checked ? 'true' : 'false')}} />
    }
    else if (type === 'Enum') {
        const choices = parameter.choices || []
        return (
            <select value={value} onChange={evt => {setValue(evt.target.value)}}>
                {
                    choices.map(choice => (
                        <option key={choice} value={choice}>{choice}</option>
                    ))
                }
            </select>
        )
    }
    else {
        return <div>Unsupported type: {type}</div>
    }
}

type ElectricalSeriesPathSelectorProps = {
    value?: string
    nwbFile?: RemoteH5File
    setValue: (value: string) => void
}

const ElectricalSeriesPathSelector: FunctionComponent<ElectricalSeriesPathSelectorProps> = ({value, nwbFile, setValue}) => {
    const electricalSeriesPaths = useElectricalSeriesPaths(nwbFile)

    useEffect(() => {
        if (value) return
        if (!electricalSeriesPaths) return
        if (electricalSeriesPaths.length === 0) return
        setValue(electricalSeriesPaths[0])
    }, [value, electricalSeriesPaths, setValue])

    if (!electricalSeriesPaths) return <div>Loading...</div>
    if (electricalSeriesPaths.length === 0) return <div>No electrical series found.</div>
    return (
        <select value={value} onChange={evt => {setValue(evt.target.value)}}>
            {
                [...electricalSeriesPaths].map(path => (
                    <option key={path} value={path}>{path}</option>
                ))
            }
        </select>
    )
}

export default EditJobDefinitionWindow