import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import ComputeResourceIdComponent from "../../../ComputeResourceIdComponent";
import { fetchJob } from "../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { NBJob } from "../../../types/neurobass-types";
import UserIdComponent from "../../../UserIdComponent";
import { useProject } from "../ProjectPageContext";

type Props = {
    width: number,
    height: number,
    jobId: string
}

const useJob = (workspaceId: string, projectId: string, jobId: string) => {
    const [job, setJob] = useState<NBJob | undefined>()

    const [refreshCode, setRefreshCode] = useState(0)
    const refreshJob = useCallback(() => {
        setRefreshCode(rc => rc + 1)
    }, [])

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    useEffect(() => {
        let canceled = false
        ;(async () => {
            setJob(undefined)
            const job = await fetchJob(workspaceId, projectId, jobId, auth)
            if (canceled) return
            setJob(job)
        })()
        return () => {
            canceled = true
        }
    }, [workspaceId, projectId, jobId, auth, refreshCode])
    return {job, refreshJob}
}

const JobView: FunctionComponent<Props> = ({ width, height, jobId }) => {
    const {workspaceId, projectId} = useProject()
    const {job, refreshJob} = useJob(workspaceId, projectId, jobId)
    if (!job) {
        return (
            <p>Loading job {jobId}</p>
        )
    }
    return (
        <div style={{position: 'absolute', width, height, background: 'white', overflowY: 'auto'}}>
            <hr />
            <table className="table1">
                <tbody>
                    <tr>
                        <td>Job ID:</td>
                        <td>{job.jobId}</td>
                    </tr>
                    <tr>
                        <td>User</td>
                        <td><UserIdComponent userId={job.userId} /></td>
                    </tr>
                    <tr>
                        <td>Process type:</td>
                        <td>{job.processType}</td>
                    </tr>
                    <tr>
                        <td>Compute resource:</td>
                        <td><ComputeResourceIdComponent computeResourceId={job.computeResourceId} link={true} /></td>
                    </tr>
                    <tr>
                        <td>Node:</td>
                        <td>{job.computeResourceNodeId ? `${job.computeResourceNodeName} (${job.computeResourceNodeId})`: ''}</td>
                    </tr>
                    <tr>
                        <td>Job status:</td>
                        <td>{job.status}</td>
                    </tr>
                    <tr>
                        <td>Error:</td>
                        <td style={{color: 'red'}}>{job.error}</td>
                    </tr>
                    <tr>
                        <td>Elapsed time (sec)</td>
                        <td>{(job.status === 'completed' || job.status === 'failed') ? (job.timestampFinished || 0) - (job.timestampRunning || 0) : ''}</td>
                    </tr>
                </tbody>
            </table>
            <hr />
            <button onClick={refreshJob}>Refresh</button>
            <hr />
            <h3>Console output</h3>
            <pre>
                {job.consoleOutput}
            </pre>
        </div>
    )
}

export default JobView