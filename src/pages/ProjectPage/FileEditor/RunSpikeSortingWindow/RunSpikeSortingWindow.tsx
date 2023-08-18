import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react"
import { createJob, NBProcessingJobDefinition } from "../../../../dbInterface/dbInterface"
import { useGithubAuth } from "../../../../GithubAuth/useGithubAuth"
import { RemoteH5File } from "../../../../RemoteH5File/RemoteH5File"
import { useWorkspace } from "../../../WorkspacePage/WorkspacePageContext"
import { ProcessingToolSchemaParser } from "../../ProcessingToolsView"
import { useProject } from "../../ProjectPageContext"
import EditJobDefinitionWindow from "./EditJobDefinitionWindow"

type RunSpikeSortingWindowProps = {
    fileName: string
    onClose: () => void
    spikeSortingToolName?: string
    nwbFile?: RemoteH5File
}

const RunSpikeSortingWindow: FunctionComponent<RunSpikeSortingWindowProps> = ({fileName, onClose, spikeSortingToolName, nwbFile}) => {
    const {projectId, workspaceId} = useProject()
    const {computeResourceSpec} = useWorkspace()

    const spikeSortingTool = useMemo(() => {
        return computeResourceSpec?.processing_tools.find(tool => (tool.name === spikeSortingToolName))
    }, [computeResourceSpec, spikeSortingToolName])

    const [submitting, setSubmitting] = useState<boolean>(false)

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const [jobDefinition, setJobDefinition] = useState<NBProcessingJobDefinition | undefined>(undefined)
    useEffect(() => {
        if (!spikeSortingTool) return
        const ss = new ProcessingToolSchemaParser(spikeSortingTool.schema)
        const jd: NBProcessingJobDefinition = {
            inputFiles: [
                {
                    name: 'input',
                    fileName
                }
            ],
            outputFiles: [
                {
                    name: 'output',
                    fileName: `.${spikeSortingTool.name}/${fileName}`
                }
            ],
            inputParameters: ss.parameters.map(p => ({
                name: p.name,
                value: p.default
            })),
            toolName: spikeSortingTool.name
        }
        setJobDefinition(jd)
    }, [spikeSortingTool, fileName])

    const handleSubmit = useCallback(async () => {
        if (!spikeSortingToolName) return
        if (!jobDefinition) return
        setSubmitting(true)
        try {
            await createJob(workspaceId, projectId, jobDefinition, auth)
            onClose()
        }
        finally {
            setSubmitting(false)
        }
    }, [spikeSortingToolName, jobDefinition, workspaceId, projectId, auth, onClose])

    const submitEnabled = !submitting

    useEffect(() => {
        console.info('Job definition:', jobDefinition)
    }, [jobDefinition])

    return (
        <div>
            <h3>Run spike sorting</h3>
            <div>
                Spike sorter: {spikeSortingTool?.attributes.label || spikeSortingTool?.name}
            </div>
            <div>&nbsp;</div>
            <div>
                <button onClick={handleSubmit} disabled={!submitEnabled}>Submit job</button>
            </div>
            <hr />
            {
                spikeSortingTool && <EditJobDefinitionWindow
                    jobDefinition={jobDefinition}
                    setJobDefinition={setJobDefinition}
                    processingTool={spikeSortingTool}
                    nwbFile={nwbFile}
                />
            }
            <hr />
        </div>
    )
}

export default RunSpikeSortingWindow