import { ChangeEvent, FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import yaml from 'js-yaml'
import Hyperlink from "../../../components/Hyperlink";
import { useProject } from "../ProjectPageContext";
import SmallIconButton from "../../../components/SmallIconButton";
import { Cancel, Edit, Save } from "@mui/icons-material";

type Props = {
    width: number
    height: number
    text: string
    onSetText: (text: string) => void
    readOnly: boolean
    outputFileName?: string
}

type Nba = {
    nbaType: 'mountainsort5' | 'kilosort3'
    recording_nwb_file?: string
    recording_electrical_series_path?: string
    required_resources?: {
        num_cpus: number
        ram_gb: number
        timeout_sec: number
    }
}

const options: {
    key: string
    label: string
    type: 'number' | 'boolean' | 'string'
    required: boolean
    readOnly?: boolean
    resources?: boolean
}[] = [
    {key: 'nba_type', label: 'Analysis type', type: 'string', required: true, readOnly: false},
    {key: 'recording_nwb_file', label: 'Recording NWB file', type: 'string', required: true},
    {key: 'recording_electrical_series_path', label: 'Elec. series path', type: 'string', required: true},
    {key: 'num_cpus', label: 'num. CPUs', type: 'number', required: true, resources: true},
    {key: 'ram_gb', label: 'RAM (GB)', type: 'number', required: true, resources: true},
    {key: 'timeout_sec', label: 'timeout (sec)', type: 'number', required: true, resources: true}
]

const NbaFileEditor: FunctionComponent<Props> = ({width, height, text, onSetText, readOnly}) => {
    const {openTab, fileHasBeenEdited} = useProject()
    const [editText, setEditText] = useState<string | undefined>(undefined)
    useEffect(() => {
        setEditText(text)
    }, [text])

    const nba: Nba | undefined = useMemo(() => {
        if (editText === undefined) return undefined
        try {
            return editText ? yaml.load(editText) as Nba : undefined
        } catch (e) {
            console.warn(editText)
            console.warn('Error parsing nba yaml')
            return undefined
        }
    }, [editText])

    const [editing, setEditing] = useState(false)

    const handleSave = useCallback(() => {
        if (editText) {
            onSetText(editText)
        }
        setEditing(false)
    }, [editText, onSetText])

    const handleCancel = useCallback(() => {
        setEditText(text)
        setEditing(false)
    }, [text])

    const canSave = useMemo(() => (
        editText !== text
    ), [editText, text])

    const recordingNwbFileEdited = useMemo(() => (fileHasBeenEdited(nba?.recording_nwb_file || '')), [nba?.recording_nwb_file, fileHasBeenEdited])

    if (nba === undefined) {
        return (
            <div style={{position: 'absolute', width, height, overflow: 'auto', background: 'lightgray'}}>
                Loading...
            </div>
        )
    }
    const iconButtonFontSize = 22

    return (
        <div style={{position: 'absolute', width, height, overflow: 'auto', background: '#eee'}}>
            <div style={{padding: 10}}>
                <div>
                    {
                        !editing && (
                            readOnly ? (
                                <span>read only</span>
                            ) : (
                                <SmallIconButton icon={<Edit />} onClick={() => setEditing(true)} title="Edit .nba file" label="Edit" fontSize={iconButtonFontSize} />
                            )
                        )
                    }
                    {
                        editing && <SmallIconButton disabled={!canSave} icon={<Save />} onClick={handleSave} title="Save changes to .nba file" fontSize={iconButtonFontSize} label="Save" />
                    }
                    {
                        editing && <span>&nbsp;&nbsp;&nbsp;</span>
                    }
                    {
                        editing && <SmallIconButton icon={<Cancel />} onClick={handleCancel} title="Cancel editing" fontSize={iconButtonFontSize} label="Cancel" />
                    }
                </div>
                <hr />
                <table className="table1" style={{maxWidth: 400}}>
                    <tbody>
                        {
                            options.filter(o => !o.resources).map(option => (
                                <tr key={option.key}>
                                    <td>{option.label}</td>
                                    <td>
                                        {
                                            option.key === 'recording_nwb_file' ? (
                                                editing ? (
                                                    <NwbFileSelector value={nba.recording_nwb_file} onChange={recording_nwb_file => setEditText(yaml.dump({...nba, recording_nwb_file}))} />
                                                ) : (
                                                    <span>
                                                        <Hyperlink onClick={() => nba.recording_nwb_file && openTab(`file:${nba.recording_nwb_file}`)}>{nba.recording_nwb_file || ''}</Hyperlink>
                                                        {
                                                            recordingNwbFileEdited && <span style={{color: 'red'}}> (edited)</span>
                                                        }
                                                    </span>
                                                )
                                            ) : (
                                                editing ? (
                                                    <OptionInput
                                                        value={(nba as any)[option.key]}
                                                        type={option.type}
                                                        required={option.required}
                                                        onChange={value => setEditText(yaml.dump({...nba, [option.key]: value}))}
                                                    />
                                                ) : (
                                                    <OptionDisplay
                                                        value={(nba as any)[option.key]}
                                                        type={option.type}
                                                    />
                                                )
                                            )
                                        }
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                {/* <h4>Required resources (may affect whether or how quickly the job gets picked up by a compute resource):</h4>
                <table className="table1" style={{maxWidth: 400}}>
                    <tbody>
                        {
                            options.filter(o => o.resources).map(option => (
                                <tr key={option.key}>
                                    <td>{option.label}</td>
                                    <td>
                                        {
                                            editing ? (
                                                <OptionInput
                                                    value={(nba.required_resources as any)?.[option.key]}
                                                    type={option.type}
                                                    required={option.required}
                                                    onChange={value => setEditText(yaml.dump({...nba, required_resources: {...nba.required_resources, [option.key]: value}}))}
                                                />
                                            ) : (
                                                <OptionDisplay
                                                    value={(nba.required_resources as any)?.[option.key]}
                                                    type={option.type}
                                                />
                                            )
                                        }
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table> */}
            </div>
        </div>
    )
}

const NwbFileSelector: FunctionComponent<{value?: string, onChange: (value: string) => void}> = ({value, onChange}) => {
    const {files} = useProject()
    const nwbFiles = useMemo(() => (
        (files || []).filter(f => f.fileName.endsWith('.nwb'))
    ), [files])
    return (
        <select value={value} onChange={e => onChange(e.target.value)}>
            <option value="">Select a nwb file</option>
            {
                nwbFiles.map(f => (
                    <option key={f.fileName} value={f.fileName}>{f.fileName}</option>
                ))
            }
        </select>
    )
}

const OptionInput: FunctionComponent<{value?: string | number | boolean, type: 'string' | 'number' | 'boolean', required: boolean, onChange: (value: string | number | boolean) => void}> = ({value, type, required, onChange}) => {
    const [editValue, setEditValue] = useState<string>()
    useEffect(() => {
        if (type === 'number') {
            setEditValue(value + '')
        }
        else if (type === 'boolean') {
            setEditValue(value ? 'true' : 'false')
        }
        else if (type === 'string') {
            setEditValue((value || '') + '')
        }
    }, [value, type])
    useEffect(() => {
        if (type === 'number') {
            const isValidNumber = editValue !== undefined && (!isNaN(Number(editValue)))
            if (isValidNumber) {
                onChange(Number(editValue))
            }
        }
        else if (type === 'boolean') {
            const isValidBoolean = (editValue === 'true' || editValue === 'false')
            if (isValidBoolean) {
                onChange(editValue === 'true')
            }
        }
        else if (type === 'string') {
            onChange(editValue || '')
        }
    }, [editValue, type, onChange])
    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value)
    }, [])
    const handleSelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        setEditValue(e.target.value)
    }, [])
    if (editValue === undefined) return null
    if (type === 'boolean') {
        return (
            <select value={editValue} onChange={handleSelectChange}>
                <option value="true">true</option>
                <option value="false">false</option>
            </select>
        )
    }
    else {
        return (
            <input
                type="text"
                value={editValue}
                onChange={handleInputChange}
            />
        )
    }
}

const OptionDisplay: FunctionComponent<{value?: string | number | boolean, type: 'string' | 'number' | 'boolean'}> = ({value, type}) => {
    if (type === 'number') {
        return <span>{value}</span>
    }
    else if (type === 'boolean') {
        return <span>{value ? 'true' : 'false'}</span>
    }
    else if (type === 'string') {
        return <span>{value}</span>
    }
    return null
}

export default NbaFileEditor