import { FunctionComponent, useEffect, useMemo, useState } from "react";
import Hyperlink from "../../components/Hyperlink";
import ComputeResourceIdComponent from "../../ComputeResourceIdComponent";
import { fetchJobsForComputeResource } from "../../dbInterface/dbInterface";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import { timeAgoString } from "../../timeStrings";
import { NBJob } from "../../types/neurobass-types";
import UserIdComponent from "../../UserIdComponent";
import useRoute from "../../useRoute";

type Props = {
    computeResourceId: string
}

const ComputeResourceJobsTable: FunctionComponent<Props> = ({ computeResourceId }) => {
    const [jobs, setJobs] = useState<NBJob[] | undefined>()

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    useEffect(() => {
        (async () => {
            const sj = await fetchJobsForComputeResource(computeResourceId, auth)
            setJobs(sj)
        })()
    }, [computeResourceId, auth])

    const sortedJobs = useMemo(() => {
        return jobs ? [...jobs].sort((a, b) => (b.timestampCreated - a.timestampCreated))
            .sort((a, b) => {
                const statuses = ['running', 'pending', 'failed', 'completed']
                return statuses.indexOf(a.status) - statuses.indexOf(b.status)
            }) : undefined
    }, [jobs])

    const {setRoute} = useRoute()

    if (!sortedJobs) {
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
                    <th>Status</th>
                    <th>User</th>
                    <th>Created</th>
                    <th>Compute</th>
                </tr>
            </thead>
            <tbody>
                {
                    sortedJobs.map((jj) => (
                        <tr key={jj.jobId}>
                            <td>{
                                // (workspaceRole === 'admin' || workspaceRole === 'editor') && (
                                //     <JobRowActions job={jj} />
                                // )
                            }</td>
                            <td>
                                {jj.jobId}
                            </td>
                            <td>
                                <Hyperlink onClick={() => setRoute({page: 'workspace', workspaceId: jj.workspaceId})}>{jj.workspaceId}</Hyperlink>
                            </td>
                            <td>
                                <Hyperlink onClick={() => setRoute({page: 'project', projectId: jj.projectId})}>{jj.projectId}</Hyperlink>
                            </td>
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

export default ComputeResourceJobsTable