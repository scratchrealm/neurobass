import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { cloneProject, createProject, fetchProjects, setProjectFileContent, setProjectProperty } from "../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import { SPProject } from "../../../types/neurobass-types";
import useRoute from "../../../useRoute";
import { useWorkspace } from "../WorkspacePageContext";

type Props = {
    onClose: () => void
}

const templatesWorkspaceId = 'jojcnols' // hard-coded for now

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
        let newProjectId: string
        if (selectedProjectId !== '<none>') {
            newProjectId = await cloneProject(templatesWorkspaceId, selectedProjectId, workspaceId, auth)
            await setProjectProperty(newProjectId, 'name', newProjectName, auth)
        }
        else {
            newProjectId = await createProject(workspaceId, newProjectName, auth)
        }
        await setProjectFileContent(workspaceId, newProjectId, 'description.md', `# ${newProjectName}\n\n`, auth)
        setRoute({page: 'project', projectId: newProjectId})
        onClose()
    }, [selectedProjectId, newProjectName, workspaceId, auth, onClose, setRoute])
    const submitEnabled = !!selectedProjectId && !creatingProject
    return (
        <div>
            <h3>Create a project</h3>
            <p>Choose a template for the new project</p>
            <ProjectTemplateSelector
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
            />
            <hr />
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

type ProjectTemplateSelectorProps = {
    selectedProjectId?: string
    setSelectedProjectId: (projectId: string) => void
}

const ProjectTemplateSelector: FunctionComponent<ProjectTemplateSelectorProps> = ({selectedProjectId, setSelectedProjectId}) => {
    const [projects, setProjects] = useState<SPProject[]>()

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    useEffect(() => {
        (async () => {
            const p = await fetchProjects(templatesWorkspaceId, auth)
            setProjects(p)
        })()
    }, [auth])
    useEffect(() => {
        // select default project
        if (!projects) return
        if (!selectedProjectId) {
            const defaultProjectId = projects.find(p => p.name.toLowerCase().includes('bare'))?.projectId || projects[0].projectId
            setSelectedProjectId(defaultProjectId)
        }
    }, [projects, selectedProjectId, setSelectedProjectId])
    return (
        <table>
            <tbody>
                <tr key="none" style={{cursor: 'pointer'}} onClick={() => setSelectedProjectId('<none>')}>
                    <td>
                        <input type="radio" checked={selectedProjectId === '<none>'} onChange={() => {}} />
                    </td>
                    <td>Empty project</td>
                    <td></td>
                </tr>
                {
                    projects && projects.map(project => (
                        <tr key={project.projectId} style={{cursor: 'pointer'}} onClick={() => setSelectedProjectId(project.projectId)}>
                            <td>
                                <input type="radio" checked={selectedProjectId === project.projectId} onChange={() => {}} />
                            </td>
                            <td>{project.name}</td>
                            <td>{project.description}</td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    )
}

export default CreateProjectWindow;