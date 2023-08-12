import { FunctionComponent } from "react";
import ProjectsMenuBar from "./ProjectsMenuBar";
import ProjectsTable from "./ProjectsTable";

type Props = {
    width: number
    height: number
}

const WorkspaceMainPanel: FunctionComponent<Props> = ({ width, height }) => {
    return (
        <div style={{padding: 10}}>
            <ProjectsMenuBar />
            <div style={{ height: 10 }} />
            <ProjectsTable />
        </div>
    )
}

export default WorkspaceMainPanel;