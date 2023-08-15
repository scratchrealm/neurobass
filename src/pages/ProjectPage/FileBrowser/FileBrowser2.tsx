import { faPython } from '@fortawesome/free-brands-svg-icons';
import { faFile } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FunctionComponent, useCallback, useMemo, useReducer } from "react";
import Hyperlink from '../../../components/Hyperlink';
import { timeAgoString } from '../../../timeStrings';
import { NBFile } from '../../../types/neurobass-types';
import { useProject } from '../ProjectPageContext';
import './file-browser-table.css';
import FileBrowserMenuBar from './FileBrowserMenuBar';
import formatByteCount from './formatByteCount';

type Props = {
    width: number
    height: number
    files: NBFile[] | undefined
    onOpenFile: (path: string) => void
    onDeleteFile: (path: string) => void
    onDuplicateFile: (path: string) => void
    onRenameFile: (path: string) => void
    hideSizeColumn?: boolean
}

type FileItem = {
    id: string
    name: string
    selected: boolean
    size: number
    timestampCreated: number
}

export type SelectedStrings = Set<string>

export type SelectedStringsAction = {
    type: 'toggle'
    value: string
} | {
    type: 'set'
    values: Set<string>
}

export const selectedStringsReducer = (state: SelectedStrings, action: SelectedStringsAction): SelectedStrings => {
    if (action.type === 'toggle') {
        const ret = new Set(state)
        if (ret.has(action.value)) {
            ret.delete(action.value)
        }
        else {
            ret.add(action.value)
        }
        return ret
    }
    else if (action.type === 'set') {
        return new Set(action.values)
    }
    else {
        return state
    }
}

const FileBrowser2: FunctionComponent<Props> = ({width, height, onOpenFile, files, hideSizeColumn}) => {
    const {currentTabName} = useProject()

    const [selectedFileNames, selectedFileNamesDispatch] = useReducer(selectedStringsReducer, new Set<string>())

    const fileItems = useMemo(() => {
        const ret: FileItem[] = []
        for (const x of files || []) {
            ret.push({
                id: x.fileName,
                name: x.fileName,
                selected: 'file:' + x.fileName === currentTabName,
                size: x.size,
                timestampCreated: x.timestampCreated
            })
        }
        ret.sort((a, b) => {
            if ((a.name.endsWith('.nwb')) && (!b.name.endsWith('.nwb'))) {
                return 1
            }
            else if ((!a.name.endsWith('.nwb')) && (b.name.endsWith('.nwb'))) {
                return -1
            }
            return a.name.localeCompare(b.name)
        })
        return ret
    }, [files, currentTabName])

    const handleClickFile = useCallback((fileId: string) => {
        onOpenFile(fileId)
    }, [onOpenFile])

    const menuBarHeight = 30
    const hPadding = 20
    const vPadding = 5

    const colWidth = 15
    
    return (
        <div style={{position: 'absolute', width, height}}>
            <div style={{position: 'absolute', width: width - hPadding * 2, height: menuBarHeight - vPadding * 2, paddingLeft: hPadding, paddingRight: hPadding, paddingTop: vPadding, paddingBottom: vPadding}}>
                <FileBrowserMenuBar
                    width={width - hPadding * 2}
                    height={menuBarHeight - vPadding * 2}
                    selectedFileNames={Array.from(selectedFileNames)}
                    onResetSelection={() => selectedFileNamesDispatch({type: 'set', values: new Set()})}
                />
            </div>
            <div style={{position: 'absolute', width: width - hPadding * 2, height: height - menuBarHeight - vPadding * 2, top: menuBarHeight, overflowY: 'scroll', paddingLeft: hPadding, paddingRight: hPadding, paddingTop: vPadding, paddingBottom: vPadding}}>
                <table className="file-browser-table">
                    <thead>
                        <tr>
                            <th style={{width: colWidth}}></th>
                            <th style={{width: colWidth}}></th>
                            <th>File</th>
                            <th>Modified</th>
                            {!hideSizeColumn && <th>Size</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {
                            fileItems.map(x => (
                                <tr key={x.id}>
                                    <td style={{width: colWidth}}><TableCheckbox checked={selectedFileNames.has(x.name)} onClick={() => selectedFileNamesDispatch({type: 'toggle', value: x.name})} /></td>
                                    <td style={{width: colWidth}}><FileIcon fileName={x.name} /></td>
                                    <td>
                                        <Hyperlink
                                            onClick={() => handleClickFile(x.name)}
                                        >{x.name}</Hyperlink>
                                    </td>
                                    <td><span style={{whiteSpace: 'nowrap'}}>{timeAgoString(x.timestampCreated)}</span></td>
                                    {!hideSizeColumn && <td>{formatByteCount(x.size)}</td>}
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export const FileIcon: FunctionComponent<{fileName: string}> = ({fileName}) => {
    const ext = fileName.split('.').pop()
    if (ext === 'py') {
        return <FontAwesomeIcon icon={faPython} style={{color: 'darkblue'}} />
    }
    else if (ext === 'json') {
        return <FontAwesomeIcon icon={faFile as any} style={{color: 'black'}} />
    }
    else if (ext === 'stan') {
        // return <FontAwesomeIcon icon={faFile as any} style={{color: 'darkorange'}} />
        return <img src="/neurobass-logo.png" alt="logo" height={14} style={{paddingBottom: 0, cursor: 'pointer'}} />
    }
    else if (ext === 'nwb') {
        return <FontAwesomeIcon icon={faFile as any} style={{color: 'red'}} />
    }
    else {
        return <FontAwesomeIcon icon={faFile as any} style={{color: 'gray'}} />
    }
}

export const TableCheckbox: FunctionComponent<{checked: boolean, onClick: () => void}> = ({checked, onClick}) => {
    return (
        <input type="checkbox" checked={checked} onClick={onClick} onChange={() => {}} style={{cursor: 'pointer'}} />
    )
}

export default FileBrowser2