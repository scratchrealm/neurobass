import { FunctionComponent, useMemo } from "react";
import Hyperlink from "../../components/Hyperlink";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import { useSPMain } from "../../SPMainContext";
import { timeAgoString } from "../../timeStrings";
import UserIdComponent from "../../UserIdComponent";
import useRoute from "../../useRoute";

type Props = {
    filter: 'community' | 'user'
}

const WorkspacesTable: FunctionComponent<Props> = ({filter}) => {
    const {workspaces} = useSPMain()
    const {setRoute} = useRoute()

    const {userId} = useGithubAuth()

    const workspaces2 = useMemo(() => {
        if (!workspaces) return undefined
        if (filter === 'community') {
            return workspaces.filter(workspace => workspace.listed)
        } else {
            return workspaces.filter(workspace => {
                if (!userId) return false
                if (userId.startsWith('admin|')) return true
                if (workspace.ownerId === userId) return true
                if (workspace.users.map(user => user.userId).includes(userId || '')) return true
                return false
            })
        }
    }, [filter, workspaces, userId])

    if (!workspaces2) {
        return <p>Loading...</p>
    }

    return (
        <table className="scientific-table">
            <thead>
                <tr>
                    <th>Workspace</th>
                    <th>Owner</th>
                    <th>Created</th>
                    <th>Modified</th>
                    </tr>
            </thead>
            <tbody>
                    {workspaces2.map(workspace => (
                        <tr key={workspace.workspaceId}>
                            <td>
                                <Hyperlink onClick={() => setRoute({page: 'workspace', workspaceId: workspace.workspaceId})}>
                                    {workspace.name}
                                </Hyperlink>
                            </td>
                            <td><UserIdComponent userId={workspace.ownerId} /></td>
                            <td>{timeAgoString(workspace.timestampCreated)}</td>
                            <td>{timeAgoString(workspace.timestampModified)}</td>
                        </tr>
                    ))}
            </tbody>
        </table>
    )
}

export default WorkspacesTable