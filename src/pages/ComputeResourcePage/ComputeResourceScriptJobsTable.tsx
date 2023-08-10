import { FunctionComponent, useEffect, useMemo, useState } from "react";
import Hyperlink from "../../components/Hyperlink";
import ComputeResourceIdComponent from "../../ComputeResourceIdComponent";
import { fetchScriptJobsForComputeResource } from "../../dbInterface/dbInterface";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import { timeAgoString } from "../../timeStrings";
import { SPScriptJob } from "../../types/neurobass-types";
import UserIdComponent from "../../UserIdComponent";
import useRoute from "../../useRoute";

type Props = {
    computeResourceId: string
}

const ComputeResourceScriptJobsTable: FunctionComponent<Props> = ({ computeResourceId }) => {
    const [scriptJobs, setScriptJobs] = useState<SPScriptJob[] | undefined>()

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    useEffect(() => {
        (async () => {
            const sj = await fetchScriptJobsForComputeResource(computeResourceId, auth)
            setScriptJobs(sj)
        })()
    }, [computeResourceId, auth])

    const sortedScriptJobs = useMemo(() => {
        return scriptJobs ? [...scriptJobs].sort((a, b) => (b.timestampCreated - a.timestampCreated))
            .sort((a, b) => {
                const statuses = ['running', 'pending', 'failed', 'completed']
                return statuses.indexOf(a.status) - statuses.indexOf(b.status)
            }) : undefined
    }, [scriptJobs])

    const {setRoute} = useRoute()

    if (!sortedScriptJobs) {
        return <div>Loading...</div>
    }

    return (
        <table className="scientific-table" style={{fontSize: 12}}>
            <thead>
                <tr>
                    <th />
                    <th>Job</th>
                    <th>Workspace</th>
                    <th>Project</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>User</th>
                    <th>Created</th>
                    <th>Compute</th>
                </tr>
            </thead>
            <tbody>
                {
                    sortedScriptJobs.map((jj) => (
                        <tr key={jj.scriptJobId}>
                            <td>{
                                // (workspaceRole === 'admin' || workspaceRole === 'editor') && (
                                //     <JobRowActions job={jj} />
                                // )
                            }</td>
                            <td>
                                {jj.scriptJobId}
                            </td>
                            <td>
                                <Hyperlink onClick={() => setRoute({page: 'workspace', workspaceId: jj.workspaceId})}>{jj.workspaceId}</Hyperlink>
                            </td>
                            <td>
                                <Hyperlink onClick={() => setRoute({page: 'project', projectId: jj.projectId})}>{jj.projectId}</Hyperlink>
                            </td>
                            <td>{jj.scriptFileName}</td>
                            <td>{
                                jj.status !== 'failed' ? (
                                    <span>{jj.status}</span>
                                ) : (
                                    <span style={{color: 'red'}}>{jj.status}: {jj.error}</span>
                                )
                            }</td>
                            <td>
                                <UserIdComponent userId={jj.userId} />
                            </td>
                            <td>{timeAgoString(jj.timestampCreated)}</td>
                            <td><ComputeResourceIdComponent computeResourceId={jj.computeResourceId} link={true} /></td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    )
}

export default ComputeResourceScriptJobsTable