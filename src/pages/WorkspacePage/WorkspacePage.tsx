import { FunctionComponent } from "react";
import HBoxLayout from "../../components/HBoxLayout";
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
    const leftPanelWidth = limit(width * 2 / 7, 200, 350)
    return (
        <SetupWorkspacePage
            workspaceId={workspaceId}
        >
            <SetupComputeResources>
                <HBoxLayout
                    widths={[leftPanelWidth, width - leftPanelWidth]}
                    height={height}
                >
                    <WorkspaceLeftPanel width={0} height={0} />
                    <WorkspaceMainPanel width={0} height={0} />
                </HBoxLayout>
            </SetupComputeResources>
        </SetupWorkspacePage>
    )
}

const limit = (x: number, min: number, max: number) => {
    if (x < min) return min
    if (x > max) return max
    return x
}

export default WorkspacePage