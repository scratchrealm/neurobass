import { FunctionComponent } from "react";
import ProjectsMenuBar from "./ProjectsMenuBar";
import ProjectsTable from "./ProjectsTable";

type Props = {
    width: number
    height: number
}

const WorkspaceMainPanel: FunctionComponent<Props> = ({ width, height }) => {
    return (
        <div>
            <ProjectsMenuBar />
            <ProjectsTable />
        </div>
    )
}

export default WorkspaceMainPanel;