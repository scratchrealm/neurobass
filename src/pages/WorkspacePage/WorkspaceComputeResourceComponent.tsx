import { Delete, Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { FunctionComponent, useState } from "react";
import ComputeResourceIdComponent from "../../ComputeResourceIdComponent";
import { useComputeResources } from "../ComputeResourcesPage/ComputeResourcesContext";
import { useWorkspace } from "./WorkspacePageContext";

type Props = {
    // none
}

const WorkspaceComputeResourceComponent: FunctionComponent<Props> = () => {
    const {workspace, workspaceRole, setWorkspaceProperty} = useWorkspace()
    const [editing, setEditing] = useState(false)

    return (
        <div>
            {
                workspace && (
                    <table>
                        <tbody>
                            <tr>
                                <td>Using compute resource:</td>
                                <td>{
                                    workspace.computeResourceId ? (
                                        <ComputeResourceIdComponent computeResourceId={workspace.computeResourceId} />
                                    ) : (
                                        <span>DEFAULT</span>
                                    )
                                }</td>
                            </tr>
                        </tbody>
                    </table>
                )
            }
            {
                workspace && !editing && workspaceRole === 'admin' && (
                    <IconButton onClick={() => setEditing(true)} title="Select a different compute resource">
                        <Edit />
                    </IconButton>
                )
            }
            {
                workspace && editing && (
                    <SelectComputeResourceComponent
                        selectedComputeResourceId={workspace.computeResourceId}
                        onSelected={(computeResourceId) => {
                            setWorkspaceProperty('computeResourceId', computeResourceId || '')
                            setEditing(false)
                        }}
                    />
                )
            }
        </div>
    )
}

type SelectComputeResourceComponentProps = {
    selectedComputeResourceId?: string
    onSelected: (computeResourceId: string) => void
}

const SelectComputeResourceComponent: FunctionComponent<SelectComputeResourceComponentProps> = ({onSelected, selectedComputeResourceId}) => {
    const {computeResources} = useComputeResources()
    return (
        <div>
            <select onChange={
                e => {
                    const crId = e.target.value
                    if (crId === '<none>') return
                    onSelected(crId)
                }
            } value={selectedComputeResourceId || ''}>
                <option value="<none>">Select a compute resource</option>
                <option value="">DEFAULT</option>
                {
                    computeResources.map(cr => (
                        <option key={cr.computeResourceId} value={cr.computeResourceId}>{cr.name} ({abbreviate(cr.computeResourceId, 10)})</option>
                    ))
                }
            </select>
        </div>
    )
}

function abbreviate(s: string, maxLength: number) {
    if (s.length <= maxLength) return s
    return s.slice(0, maxLength - 3) + '...'
}

export default WorkspaceComputeResourceComponent;