import React from "react"

type StatusBarContextType = {
    statusBarMessage: string
    setStatusBarMessage: (message: string) => void
    clearStatusBar: () => void
}

const StatusBarContext = React.createContext<StatusBarContextType>({
    statusBarMessage: '',
    setStatusBarMessage: () => {},
    clearStatusBar: () => {}
})

export const useStatusBar = () => React.useContext(StatusBarContext)

export default StatusBarContext