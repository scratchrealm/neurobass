import { FunctionComponent } from "react"
import Hyperlink from "../../components/Hyperlink"
import useRoute from "../../useRoute"
import { useProject } from "./ProjectPageContext"

const BackButton: FunctionComponent = () => {
    const {setRoute} = useRoute()
    const {workspaceId} = useProject()
    return (
        <Hyperlink onClick={() => setRoute({page: 'workspace', workspaceId})}>&#8592; Workspace</Hyperlink>
    )
}

export default BackButton