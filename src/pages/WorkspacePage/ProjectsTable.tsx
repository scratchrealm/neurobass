import { FunctionComponent } from "react";
import Hyperlink from "../../components/Hyperlink";
import { timeAgoString } from "../../timeStrings";
import useRoute from "../../useRoute";
import { useWorkspace } from "./WorkspacePageContext";

type Props = {
    // none
}

const ProjectsTable: FunctionComponent<Props> = () => {
    const {projects} = useWorkspace()
    const {setRoute} = useRoute()

    if (!projects) {
        return <p>Loading...</p>
    }

    return (
        <table className="scientific-table">
            <thead>
                <tr>
                    <th>Project</th>
                    <th>Created</th>
                    <th>Modified</th>
                    </tr>
            </thead>
            <tbody>
                    {projects.map(project => (
                        <tr key={project.projectId}>
                            <td>
                                <Hyperlink onClick={() => setRoute({page: 'project', projectId: project.projectId})}>
                                    {project.name}
                                </Hyperlink>
                            </td>
                            <td>{timeAgoString(project.timestampCreated)}</td>
                            <td>{timeAgoString(project.timestampModified)}</td>
                        </tr>
                    ))}
            </tbody>
        </table>
    )
}

export default ProjectsTable