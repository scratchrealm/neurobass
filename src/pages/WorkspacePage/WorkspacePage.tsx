import { FunctionComponent } from "react";
import Splitter from "../../components/Splitter";
import { SetupComputeResources } from "../ComputeResourcesPage/ComputeResourcesContext";
import WorkspaceLeftPanel from "./WorkspaceLeftPanel";
import WorkspaceMainPanel from "./WorkspaceMainPanel";
import { SetupWorkspacePage } from "./WorkspacePageContext";

type Props = {
    workspaceId: string
    width: number
    height: number
}

const WorkspacePage: FunctionComponent<Props> = ({workspaceId, width, height}) => {
    return (
        <SetupWorkspacePage
            workspaceId={workspaceId}
        >
            <SetupComputeResources>
                <Splitter
                    direction="horizontal"
                    width={width}
                    height={height}
                    initialPosition={Math.max(250, Math.min(600, width / 4))}
                >
                    <WorkspaceLeftPanel width={0} height={0} />
                    <WorkspaceMainPanel width={0} height={0} />
                </Splitter>
            </SetupComputeResources>
        </SetupWorkspacePage>
    )
}

export default WorkspacePage