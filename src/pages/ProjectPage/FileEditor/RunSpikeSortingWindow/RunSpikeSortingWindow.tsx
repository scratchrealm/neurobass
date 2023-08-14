import { FunctionComponent, useCallback, useMemo, useState } from "react"
import { createJob } from "../../../../dbInterface/dbInterface"
import { useGithubAuth } from "../../../../GithubAuth/useGithubAuth"
import { useProject } from "../../ProjectPageContext"

type RunSpikeSortingWindowProps = {
    fileName: string
    onClose: () => void
}

type ProcessTypeOptions = 'mountainsort5' | 'kilosort3'

const RunSpikeSortingWindow: FunctionComponent<RunSpikeSortingWindowProps> = ({fileName, onClose}) => {
    const [processType, setProcessType] = useState<ProcessTypeOptions>('mountainsort5')

    const {projectId, workspaceId} = useProject()

    const [submitting, setSubmitting] = useState<boolean>(false)

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const handleSubmit = useCallback(async () => {
        setSubmitting(true)
        try {
            await createJob(workspaceId, projectId, {
                processType,
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
    }, [workspaceId, projectId, fileName, processType, auth, onClose])

    const submitEnabled = !submitting

    return (
        <div>
            <h3>Run spike sorting</h3>
            <div>
                <label>Spike sorter:&nbsp;</label>
                <select value={processType} onChange={e => setProcessType(e.target.value as ProcessTypeOptions)}>
                    <option value="mountainsort5">MountainSort 5</option>
                    <option value="kilosort3">Kilosort 3</option>
                </select>
            </div>
            <hr />
            <div>
                <button onClick={handleSubmit} disabled={!submitEnabled}>Submit job</button>
            </div>
        </div>
    )
}

export default RunSpikeSortingWindow