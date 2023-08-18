import { FunctionComponent, useCallback, useMemo, useState } from "react"
import { createJob } from "../../../../dbInterface/dbInterface"
import { useGithubAuth } from "../../../../GithubAuth/useGithubAuth"
import { useWorkspace } from "../../../WorkspacePage/WorkspacePageContext"
import { useProject } from "../../ProjectPageContext"

type RunSpikeSortingWindowProps = {
    fileName: string
    onClose: () => void
    spikeSortingToolName: string
}

const RunSpikeSortingWindow: FunctionComponent<RunSpikeSortingWindowProps> = ({fileName, onClose, spikeSortingToolName}) => {
    const {projectId, workspaceId} = useProject()
    const {computeResourceSpec} = useWorkspace()

    const spikeSortingTool = useMemo(() => {
        return computeResourceSpec?.processing_tools.find(tool => (tool.name === spikeSortingToolName))
    }, [computeResourceSpec, spikeSortingToolName])

    const [submitting, setSubmitting] = useState<boolean>(false)

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const handleSubmit = useCallback(async () => {
        setSubmitting(true)
        try {
            await createJob(workspaceId, projectId, {
                toolName: spikeSortingToolName,
                inputFiles: [{
                    name: 'input',
                    fileName
                }],
                inputParameters: [],
                outputFiles: [{
                    name: 'output',
                    fileName: `sorting/${fileName}`
                }]
            }, auth)
            onClose()
        }
        finally {
            setSubmitting(false)
        }
    }, [workspaceId, projectId, fileName, spikeSortingToolName, auth, onClose])

    const submitEnabled = !submitting

    return (
        <div>
            <h3>Run spike sorting</h3>
            <div>
                Spike sorter: {spikeSortingTool?.attributes.label || spikeSortingTool?.name}
            </div>
            <hr />
            <div>
                <button onClick={handleSubmit} disabled={!submitEnabled}>Submit job</button>
            </div>
        </div>
    )
}

export default RunSpikeSortingWindow