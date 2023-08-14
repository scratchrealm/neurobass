import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { createProject, setFileText } from "../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import useRoute from "../../../useRoute";
import { useWorkspace } from "../WorkspacePageContext";

type Props = {
    onClose: () => void
}

const CreateProjectWindow: FunctionComponent<Props> = ({onClose}) => {
    const {workspaceId} = useWorkspace()
    const [newProjectName, setNewProjectName] = useState('Untitled')
    const [creatingProject, setCreatingProject] = useState(false)
    const {setRoute} = useRoute()

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const handleSubmit = useCallback(async () => {
        setCreatingProject(true)
        const newProjectId = await createProject(workspaceId, newProjectName, auth)
        await setFileText(workspaceId, newProjectId, 'description.md', `# ${newProjectName}\n\n`, auth)
        setRoute({page: 'project', projectId: newProjectId})
        onClose()
    }, [newProjectName, workspaceId, auth, onClose, setRoute])
    const submitEnabled = newProjectName && !creatingProject
    return (
        <div>
            <h3>Create a project</h3>
            <div>
                <label>Project name:&nbsp;</label>
                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
            </div>
            <hr />
            <div>
                <button onClick={handleSubmit} disabled={!submitEnabled}>Create</button>
            </div>
            <div>
                {
                    creatingProject ? (
                        <div>Creating project...</div>
                    ) : null
                }
            </div>
        </div>
    )
}

export default CreateProjectWindow;