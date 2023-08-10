import { FunctionComponent } from "react";
import Splitter from "../../components/Splitter";
import { SetupWorkspacePage } from "../WorkspacePage/WorkspacePageContext";
import ProjectLeftPanel from "./ProjectLeftPanel";
import ProjectMainPanel from "./ProjectMainPanel";
import { SetupProjectPage, useProject } from "./ProjectPageContext";

type Props = {
    width: number
    height: number
    projectId: string
}

const WorkspacePage: FunctionComponent<Props> = ({projectId, width, height}) => {
    return (
        <SetupProjectPage
            projectId={projectId}
        >
            <WorkspacePageChild
                width={width}
                height={height}
                projectId={projectId}
            />
        </SetupProjectPage>
    )
}

const WorkspacePageChild: FunctionComponent<Props> = ({width, height}) => {
    const {workspaceId} = useProject()
    const initialPosition = Math.max(250, Math.min(600, width / 4))
    return (
        <SetupWorkspacePage
            workspaceId={workspaceId}
        >
            <Splitter
                width={width}
                height={height}
                initialPosition={initialPosition}
                direction='horizontal'
            >
                <ProjectLeftPanel width={0} height={0} />
                <ProjectMainPanel width={0} height={0} />
            </Splitter>
        </SetupWorkspacePage>
    )
}   

export default WorkspacePage