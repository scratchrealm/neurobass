import { FunctionComponent, PropsWithChildren, useCallback, useEffect, useState } from "react"
import StatusBarContext from "./StatusBarContext"

const SetupStatusBar: FunctionComponent<PropsWithChildren> = ({children}) => {
    const [statusBarMessage, setStatusBarMessage] = useState<string>('')
    const clearStatusBar = useCallback(() => {
        setStatusBarMessage('Ready')
    }, [setStatusBarMessage])
    useEffect(() => {
        clearStatusBar()
    }, [clearStatusBar])
    return (
        <StatusBarContext.Provider value={{statusBarMessage, setStatusBarMessage, clearStatusBar}}>
            {children}
        </StatusBarContext.Provider>
    )
}

export default SetupStatusBar