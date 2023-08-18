import { FunctionComponent, useMemo } from "react";
import { useProject } from "../ProjectPageContext";
import JobsTable from "./JobsTable";

type Props = {
    width: number,
    height: number,
    fileName: string
    onCreateJob?: () => void
    createJobEnabled?: boolean
    createJobTitle?: string
}

const JobsWindow: FunctionComponent<Props> = ({ width, height, fileName, onCreateJob, createJobEnabled, createJobTitle }) => {
    const {jobs, openTab} = useProject()

    const filteredJobs = useMemo(() => {
        if (!jobs) return undefined
        if (fileName.endsWith('.py')) {
            return jobs.filter(jj => (jj.toolName === 'script' && jj.inputParameters.map(f => (f.value).includes(fileName))))
        }
        else if (fileName.endsWith('.nwb')) {
            return jobs.filter(jj => (jj.inputFiles.map(x => (x.fileName)).includes(fileName)))
        }
        else return jobs
    }, [jobs, fileName])

    // const iconFontSize = 20

    return (
        <JobsTable
            width={width}
            height={height}
            fileName={fileName}
            jobs={filteredJobs}
            onJobClicked={jobId => openTab(`job:${jobId}`)}
            onCreateJob={onCreateJob}
            createJobEnabled={createJobEnabled}
            createJobTitle={createJobTitle}
        />
        // <>
        //     <div>
        //         {fileName.endsWith('.py') && (
        //             <SmallIconButton
        //                 icon={<PlayArrow />}
        //                 onClick={handleCreateScriptJob}
        //                 disabled={!canCreateJob}
        //                 title={createJobTitle}
        //                 label="Run"
        //                 fontSize={iconFontSize}
        //             />
        //         )}
        //         &nbsp;&nbsp;&nbsp;&nbsp;
        //         <SmallIconButton
        //             icon={<Refresh />}
        //             onClick={refreshJobs}
        //             title="Refresh jobs"
        //             label="Refresh"
        //             fontSize={iconFontSize}
        //         />                
        //     </div>
        // </>
    )
}

export default JobsWindow