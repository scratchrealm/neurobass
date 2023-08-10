import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import ComputeResourceIdComponent from "../../../ComputeResourceIdComponent";
import { fetchScriptJob } from "../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { GetScriptJobRequest } from "../../../types/NeurobassRequest";
import { SPScriptJob } from "../../../types/neurobass-types";
import UserIdComponent from "../../../UserIdComponent";
import { useProject } from "../ProjectPageContext";

type Props = {
    width: number,
    height: number,
    scriptJobId: string
}

const useScriptJob = (workspaceId: string, projectId: string, scriptJobId: string) => {
    const [scriptJob, setScriptJob] = useState<SPScriptJob | undefined>()

    const [refreshCode, setRefreshCode] = useState(0)
    const refreshScriptJob = useCallback(() => {
        setRefreshCode(rc => rc + 1)
    }, [])

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    useEffect(() => {
        let canceled = false
        ;(async () => {
            setScriptJob(undefined)
            const scriptJob = await fetchScriptJob(workspaceId, projectId, scriptJobId, auth)
            if (canceled) return
            setScriptJob(scriptJob)
        })()
        return () => {
            canceled = true
        }
    }, [workspaceId, projectId, scriptJobId, auth, refreshCode])
    return {scriptJob, refreshScriptJob}
}

const ScriptJobView: FunctionComponent<Props> = ({ width, height, scriptJobId }) => {
    const {workspaceId, projectId} = useProject()
    const {scriptJob, refreshScriptJob} = useScriptJob(workspaceId, projectId, scriptJobId)
    if (!scriptJob) {
        return (
            <p>Loading script job {scriptJobId}</p>
        )
    }
    return (
        <div style={{position: 'absolute', width, height, background: 'white', overflowY: 'auto'}}>
            <hr />
            <table className="table1">
                <tbody>
                    <tr>
                        <td>Script job ID:</td>
                        <td>{scriptJob.scriptJobId}</td>
                    </tr>
                    <tr>
                        <td>User</td>
                        <td><UserIdComponent userId={scriptJob.userId} /></td>
                    </tr>
                    <tr>
                        <td>Script file name:</td>
                        <td>{scriptJob.scriptFileName}</td>
                    </tr>
                    <tr>
                        <td>Compute resource:</td>
                        <td><ComputeResourceIdComponent computeResourceId={scriptJob.computeResourceId} link={true} /></td>
                    </tr>
                    <tr>
                        <td>Node:</td>
                        <td>{scriptJob.computeResourceNodeId ? `${scriptJob.computeResourceNodeName} (${scriptJob.computeResourceNodeId})`: ''}</td>
                    </tr>
                    <tr>
                        <td>Job status:</td>
                        <td>{scriptJob.status}</td>
                    </tr>
                    <tr>
                        <td>Error:</td>
                        <td style={{color: 'red'}}>{scriptJob.error}</td>
                    </tr>
                    <tr>
                        <td>Elapsed time (sec)</td>
                        <td>{scriptJob.elapsedTimeSec}</td>
                    </tr>
                </tbody>
            </table>
            <hr />
            <button onClick={refreshScriptJob}>Refresh</button>
            <hr />
            <h3>Console output</h3>
            <pre>
                {scriptJob.consoleOutput}
            </pre>
        </div>
    )
}

export default ScriptJobView