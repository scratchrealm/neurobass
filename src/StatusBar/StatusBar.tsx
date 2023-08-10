import { FunctionComponent } from "react";
import { useStatusBar } from "./StatusBarContext";
import './StatusBar.css'

type Props = {
    width: number
    height: number
}

const StatusBar: FunctionComponent<Props> = ({width, height}) => {
    const {statusBarMessage} = useStatusBar()
    return (
        <div className="StatusBar" style={{position: 'absolute', width, height}}>
            {statusBarMessage}
        </div>
    )
}

export default StatusBar