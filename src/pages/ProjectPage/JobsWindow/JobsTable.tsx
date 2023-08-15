import { Delete } from "@mui/icons-material";
import { FunctionComponent, useCallback, useMemo, useReducer } from "react";
import Hyperlink from "../../../components/Hyperlink";
import SmallIconButton from "../../../components/SmallIconButton";
import ComputeResourceIdComponent from "../../../ComputeResourceIdComponent";
import { confirm } from "../../../confirm_prompt_alert";
import { timeAgoString } from "../../../timeStrings";
import { NBJob } from "../../../types/neurobass-types";
import UserIdComponent from "../../../UserIdComponent";
import { selectedStringsReducer, TableCheckbox } from "../FileBrowser/FileBrowser2";
import { useProject } from "../ProjectPageContext";
import JobsTableMenuBar from "./JobsTableMenuBar";

type Props = {
    width: number
    height: number
    fileName: string
    jobs: NBJob[] | undefined
    onJobClicked: (jobId: string) => void
    onCreateJob?: () => void
    createJobEnabled?: boolean
    createJobTitle?: string
}

const menuBarHeight = 30
const hPadding = 20
const vPadding = 5

const JobsTable: FunctionComponent<Props> = ({ width, height, fileName, jobs, onJobClicked, onCreateJob, createJobEnabled, createJobTitle }) => {
    const sortedJobs = useMemo(() => {
        if (!jobs) return []
        return [...jobs].sort((a, b) => (b.timestampCreated - a.timestampCreated))
    }, [jobs])

    const [selectedJobIds, selectedJobIdsDispatch] = useReducer(selectedStringsReducer, new Set<string>())

    const colWidth = 15

    return (
        <div style={{position: 'absolute', width, height}}>
            <div style={{position: 'absolute', width: width - hPadding * 2, height: menuBarHeight - vPadding * 2, paddingLeft: hPadding, paddingRight: hPadding, paddingTop: vPadding, paddingBottom: vPadding}}>
                <JobsTableMenuBar
                    width={width - hPadding * 2}
                    height={menuBarHeight - vPadding * 2}
                    selectedJobIds={Array.from(selectedJobIds)}
                    onResetSelection={() => selectedJobIdsDispatch({type: 'set', values: new Set<string>()})}
                    onCreateJob={onCreateJob}
                    createJobEnabled={createJobEnabled}
                    createJobTitle={createJobTitle}
                />
            </div>
            <div style={{position: 'absolute', width: width - hPadding * 2, height: height - menuBarHeight - vPadding * 2, top: menuBarHeight, overflowY: 'scroll', paddingLeft: hPadding, paddingRight: hPadding, paddingTop: vPadding, paddingBottom: vPadding}}>
                <table className="scientific-table" style={{fontSize: 12}}>
                    <thead>
                        <tr>
                            <th style={{width: colWidth}} />
                            <th style={{width: colWidth}} />
                            <th>Job</th>
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
                                    <td style={{width: colWidth}}>
                                        <TableCheckbox checked={selectedJobIds.has(jj.jobId)} onClick={() => selectedJobIdsDispatch({type: 'toggle', value: jj.jobId})} />
                                    </td>
                                    <td style={{width: colWidth}}>
                                        <JobIcon job={jj} />
                                    </td>
                                    <td>
                                        <Hyperlink onClick={() => onJobClicked(jj.jobId)}>
                                            {jj.jobId}
                                        </Hyperlink>
                                    </td>
                                    <td>{
                                        jj.status !== 'failed' ? (
                                            <span>{jj.status}</span>
                                        ) : (
                                            <Hyperlink onClick={() => onJobClicked(jj.jobId)}>
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
            </div>
        </div>
    )
}

const JobIcon: FunctionComponent<{job: NBJob}> = ({job}) => {
    // 🔴🟠🟡🟢🔵🟣⚫️⚪️🟤
    switch (job.status) {
        case 'pending':
            return <span title="Job is pending">⚪️</span>
        case 'queued':
            return <span title="Job is queued">🟣</span>
        case 'running':
            return <span title="Job is running">🟠</span>
        case 'completed':
            return <span title="Job completed">🟢</span>
        case 'failed':
            return <span title="Job failed">🔴</span>
        default:
            return <span title="Job has unknown status">⚫️</span>
    }
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