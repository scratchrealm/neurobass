import { Delete, Edit } from "@mui/icons-material";
import { FunctionComponent, useCallback, useState } from "react";
import Hyperlink from "../../components/Hyperlink";
import { alert, confirm, prompt } from "../../confirm_prompt_alert";
import UserIdComponent from "../../UserIdComponent";
import { useWorkspace } from "./WorkspacePageContext";

type Props = {
    // none
}

type Role = 'admin' | 'editor' | 'viewer'

const WorkspaceUsersComponent: FunctionComponent<Props> = () => {
    const {workspace, setWorkspaceUsers, setWorkspaceProperty, workspaceRole} = useWorkspace()
    
    const handleDeleteUser = useCallback(async (userId: string) => {
        const user = workspace?.users.find(user => user.userId === userId)
        if (!user) return
        const okay = await confirm(`Are you sure you want to delete user ${userId} from this workspace?`)
        if (!okay) return
        await setWorkspaceUsers(workspace?.users.filter(user => user.userId !== userId) || [])
    }, [workspace, setWorkspaceUsers])

    const handleAddUser = useCallback(async () => {
        const gitHubUserId = await prompt('GitHub user ID:', '')
        if (!gitHubUserId) return
        const userId = `github|${gitHubUserId}`
        const role = 'editor' as Role
        if (workspace?.users.find(user => user.userId === userId)) {
            await alert(`User ${userId} already exists`)
            return
        }
        await setWorkspaceUsers([...(workspace?.users || []), {userId, role}])
    }, [workspace, setWorkspaceUsers])

    const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined)

    const handleSetUserRole = useCallback(async (userId: string, role: Role) => {
        const user = workspace?.users.find(user => user.userId === userId)
        if (!user) return
        const newUsers = workspace?.users.map(user => {
            if (user.userId === userId) {
                return {...user, role}
            } else {
                return user
            }
        })
        await setWorkspaceUsers(newUsers || [])
        setEditingUserId(undefined)
    }, [workspace, setWorkspaceUsers])

    const setPubliclyReadableHandler = useCallback(async (readable: boolean) => {
        await setWorkspaceProperty('publiclyReadable', readable)
    }, [setWorkspaceProperty])

    const setListedHandler = useCallback(async (listed: boolean) => {
        await setWorkspaceProperty('listed', listed)
    }, [setWorkspaceProperty])

    return (
        <div>
            {
                workspaceRole === 'admin' ? (
                    <Hyperlink onClick={handleAddUser}>Add user</Hyperlink>
                ) : (
                    <span>Only workspace admins can manage users</span>
                )
            }
            <table className="scientific-table" style={{maxWidth: 380}}>
                <thead>
                    <tr>
                        <th>
                        </th>
                        <th>User</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        workspace?.users.map(user => (
                            <tr key={user.userId}>
                                <td>
                                <Delete onClick={() => handleDeleteUser(user.userId)} />
                                </td>
                                <td><UserIdComponent userId={user.userId} /></td>
                                <td>
                                    {
                                        editingUserId !== user.userId ? (
                                            <span>
                                                {user.role}
                                                &nbsp;
                                                {
                                                    editingUserId !== user.userId && (
                                                        <Edit onClick={() => setEditingUserId(user.userId)} />
                                                    )
                                                }
                                            </span>
                                        ) : (
                                            <EditRoleComponent editable={workspaceRole === 'admin'} role={user.role} onSetRole={(role) => handleSetUserRole(user.userId, role)} />
                                        )
                                    }
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <hr />
            <table>
                <tbody>
                    <tr>
                        <td>Public visibility:</td>
                        <td><PubliclyReadableComponent publiclyReadable={workspace?.publiclyReadable} setValue={setPubliclyReadableHandler} editable={workspaceRole === 'admin'} /></td>
                    </tr>
                    <tr>
                        <td>Listed:</td>
                        <td><ListedComponent listed={workspace?.listed} setValue={setListedHandler} editable={workspaceRole === 'admin'} /></td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

const EditRoleComponent: FunctionComponent<{role: Role, onSetRole: (role: Role) => void, editable: boolean}> = ({role, onSetRole, editable}) => {
    if (editable) {
        return (
            <select value={role} onChange={(e) => onSetRole(e.target.value as Role)}>
                <option value="admin">admin</option>
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
            </select>
        )
    }
    else {
        return <span>{role}</span>
    }
}

const PubliclyReadableComponent: FunctionComponent<{publiclyReadable: boolean | undefined, setValue: (v: boolean) => void, editable: boolean}> = ({publiclyReadable, setValue, editable}) => {
    if (editable) {
        return (
            <div>
                <select value={publiclyReadable ? 'true' : 'false'} onChange={(e) => {
                    const newVal = e.target.value === 'true' ? true : false
                    setValue(newVal)
                }}>
                    <option value="true">Publicly readable</option>
                    <option value="false">Not publicly readable</option>
                </select>
            </div>
        )
    }
    else {
        return (
            publiclyReadable !== undefined ? (publiclyReadable ? <span>Publicly readable</span> : <span>Not publicly readable</span>) : <span />
        )
    }
}

const ListedComponent: FunctionComponent<{listed: boolean | undefined, setValue: (v: boolean) => void, editable: boolean}> = ({listed, setValue, editable}) => {
    if (editable) {
        return (
            <div>
                <select value={listed ? 'true' : 'false'} onChange={(e) => {
                    const newVal = e.target.value === 'true' ? true : false
                    setValue(newVal)
                }}>
                    <option value="true">Listed</option>
                    <option value="false">Not listed</option>
                </select>
            </div>
        )
    }
    else {
        return (
            listed !== undefined ? (listed ? <span>Listed</span> : <span>Not listed</span>) : <span />
        )
    }
}

export default WorkspaceUsersComponent