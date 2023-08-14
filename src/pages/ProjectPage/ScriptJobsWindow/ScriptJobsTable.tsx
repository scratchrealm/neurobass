import { Delete } from "@mui/icons-material";
import { FunctionComponent, useCallback, useMemo } from "react";
import Hyperlink from "../../../components/Hyperlink";
import SmallIconButton from "../../../components/SmallIconButton";
import ComputeResourceIdComponent from "../../../ComputeResourceIdComponent";
import { confirm } from "../../../confirm_prompt_alert";
import { timeAgoString } from "../../../timeStrings";
import { NBJob } from "../../../types/neurobass-types";
import UserIdComponent from "../../../UserIdComponent";
import { useWorkspace } from "../../WorkspacePage/WorkspacePageContext";
import { useProject } from "../ProjectPageContext";

type Props = {
    fileName: string
}

const JobsTable: FunctionComponent<Props> = ({ fileName }) => {
    const {jobs, openTab} = useProject()
    const {workspaceRole} = useWorkspace()

    const sortedJobs = useMemo(() => {
        if (!jobs) return []
        return [...jobs].sort((a, b) => (b.timestampCreated - a.timestampCreated))
    }, [jobs])

    return (
        <table className="scientific-table" style={{fontSize: 12}}>
            <thead>
                <tr>
                    <th />
                    <th>Job</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>User</th>
                    <th>Created</th>
                    <th>Compute</th>
                </tr>
            </thead>
            <tbody>
                {
                    sortedJobs.filter(jj => (jj.scriptFileName === fileName)).map((jj) => (
                        <tr key={jj.jobId}>
                            <td>{
                                (workspaceRole === 'admin' || workspaceRole === 'editor') && (
                                    <JobRowActions job={jj} />
                                )
                            }</td>
                            <td>
                                <Hyperlink onClick={() => openTab(`job:${jj.jobId}`)}>
                                    {jj.jobId}
                                </Hyperlink>
                            </td>
                            <td>{jj.scriptFileName}</td>
                            <td>{
                                jj.status !== 'failed' ? (
                                    <span>{jj.status}</span>
                                ) : (
                                    <Hyperlink onClick={() => openTab(`job:${jj.jobId}`)}>
                                        <span style={{color: 'red'}}>{jj.status}: {jj.error}</span>
                                    </Hyperlink>
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

const JobRowActions: FunctionComponent<{job: NBJob}> = ({job}) => {
    const {deleteJob} = useProject()
    const handleDelete = useCallback(async () => {
        const okay = await confirm('Delete this job?')
        if (!okay) return
        deleteJob(job.jobId)
    }, [job, deleteJob])
    return (
        <span>
            <SmallIconButton
                onClick={handleDelete}
                icon={<Delete />}
                title="Delete this job"
                fontSize={20}
            />
        </span>
    )
}

export default JobsTable