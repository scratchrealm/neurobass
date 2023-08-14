import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { createProject, fetchProjects, setFileContent, setProjectProperty } from "../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { NBProject } from "../../../types/neurobass-types";
import useRoute from "../../../useRoute";
import { useWorkspace } from "../WorkspacePageContext";

type Props = {
    onClose: () => void
}

const CreateProjectWindow: FunctionComponent<Props> = ({onClose}) => {
    const {workspaceId} = useWorkspace()
    const [newProjectName, setNewProjectName] = useState('Untitled')
    const [selectedProjectId, setSelectedProjectId] = useState<string>()
    const [creatingProject, setCreatingProject] = useState(false)
    const {setRoute} = useRoute()

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    const handleSubmit = useCallback(async () => {
        if (!selectedProjectId) return
        setCreatingProject(true)
        const newProjectId = await createProject(workspaceId, newProjectName, auth)
        await setFileContent(workspaceId, newProjectId, 'description.md', `# ${newProjectName}\n\n`, auth)
        setRoute({page: 'project', projectId: newProjectId})
        onClose()
    }, [selectedProjectId, newProjectName, workspaceId, auth, onClose, setRoute])
    const submitEnabled = !!selectedProjectId && !creatingProject
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