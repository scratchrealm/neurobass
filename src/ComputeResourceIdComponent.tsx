import { FunctionComponent } from "react";
import Hyperlink from "./components/Hyperlink";
import useRoute from "./useRoute";

type Props = {
    computeResourceId: string | undefined
    link?: boolean
}

const ComputeResourceIdComponent: FunctionComponent<Props> = ({ computeResourceId, link }) => {
    const x = abbreviate(computeResourceId || '', 10)
    const {setRoute} = useRoute()
    const a = <span style={{color: '#345', fontStyle: 'italic'}}>{x || 'DEFAULT'}</span>
    const crId = computeResourceId || import.meta.env.VITE_DEFAULT_COMPUTE_RESOURCE_ID
    if (link) {
        return <Hyperlink onClick={() => setRoute({page: 'compute-resource', computeResourceId: crId})}>{a}</Hyperlink>
    }
    else {
        return a
    }
}

function abbreviate(s: string, maxLength: number) {
    if (s.length <= maxLength) return s
    return s.slice(0, maxLength - 3) + '...'
}

export default ComputeResourceIdComponent