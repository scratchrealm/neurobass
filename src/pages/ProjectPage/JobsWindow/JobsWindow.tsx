import { PlayArrow, Refresh } from "@mui/icons-material";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import SmallIconButton from "../../../components/SmallIconButton";
import { useWorkspace } from "../../WorkspacePage/WorkspacePageContext";
import { useProject } from "../ProjectPageContext";
import JobsTable from "./JobsTable";

type Props = {
    width: number,
    height: number,
    fileName: string
}

const queryParams = parseQuery(window.location.href)

const JobsWindow: FunctionComponent<Props> = ({ width, height, fileName }) => {
    const {workspaceRole} = useWorkspace()
    const {refreshJobs, createJob, jobs, openTabs} = useProject()

    const handleCreateScriptJob = useCallback(async () => {
        createJob({scriptFileName: fileName})
    }, [createJob, fileName])

    const [createJobTitle, setCreateJobTitle] = useState('Run script')

    const filteredJobs = useMemo(() => {
        if (!jobs) return undefined
        if (fileName.endsWith('.py')) {
            return jobs.filter(jj => (jj.processType === 'script' && jj.inputParameters.map(f => (f.value).includes(fileName))))
        }
        else if (fileName.endsWith('.nwb')) {
            return jobs.filter(jj => (jj.inputFiles.map(x => (x.fileName)).includes(fileName)))
        }
        else return jobs
    }, [jobs, fileName])


    const canCreateJob = useMemo(() => {
        if (!jobs) return false // not loaded yet
        const openTab = openTabs.find(t => t.tabName === `file:${fileName}`)
        if (!openTab) {
            setCreateJobTitle('Unable to find open tab')
            return false
        }
        if (!openTab.content) {
            setCreateJobTitle('File is empty')
            return false
        }
        if (openTab.content !== openTab.editedContent) {
            setCreateJobTitle('File has unsaved changes')
            return false
        }
        const pendingJob = filteredJobs && filteredJobs.find(jj => (jj.status === 'pending'))
        const runningJob = filteredJobs && filteredJobs.find(jj => (jj.status === 'running'))
        if ((pendingJob) || (runningJob)) {
            if (!(queryParams['test'] === '1')) {
                setCreateJobTitle('A job is already pending or running for this script.')
                return false
            }
        }
        if (workspaceRole === 'admin' || workspaceRole === 'editor') {
            setCreateJobTitle('Create job')
            return true
        }
        else {
            setCreateJobTitle('You do not have permission to run scripts for this project.')
        }
        return false
    }, [workspaceRole, jobs, fileName, openTabs, filteredJobs])

    const iconFontSize = 20

    return (
        <>
            <div>
                {fileName.endsWith('.py') && (
                    <SmallIconButton
                        icon={<PlayArrow />}
                        onClick={handleCreateScriptJob}
                        disabled={!canCreateJob}
                        title={createJobTitle}
                        label="Run"
                        fontSize={iconFontSize}
                    />
                )}
                &nbsp;&nbsp;&nbsp;&nbsp;
                <SmallIconButton
                    icon={<Refresh />}
                    onClick={refreshJobs}
                    title="Refresh jobs"
                    label="Refresh"
                    fontSize={iconFontSize}
                />                
            </div>
            <JobsTable
                fileName={fileName}
                jobs={filteredJobs}
            />
        </>
    )
}

function parseQuery(queryString: string) {
    const ind = queryString.indexOf('?')
    if (ind <0) return {}
    const query: {[k: string]: string} = {};
    const pairs = queryString.slice(ind + 1).split('&');
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

export default JobsWindow