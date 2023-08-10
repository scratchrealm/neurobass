import { FunctionComponent } from "react"
import Hyperlink from "../../components/Hyperlink"
import useRoute from "../../useRoute"

const BackButton: FunctionComponent = () => {
    const {setRoute} = useRoute()
    return (
        <Hyperlink onClick={() => setRoute({page: 'home'})}>&#8592; Home</Hyperlink>
    )
}

export default BackButton