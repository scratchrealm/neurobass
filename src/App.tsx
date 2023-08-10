import { BrowserRouter } from 'react-router-dom'
import './App.css'
import GithubAuthSetup from './GithubAuth/GithubAuthSetup'
import MainWindow from './MainWindow'
import SetupStatusBar from './StatusBar/SetupStatusBar'

function App() {
  return (
    <GithubAuthSetup>
      <SetupStatusBar>
        <BrowserRouter>
          <MainWindow />
        </BrowserRouter>
      </SetupStatusBar>
    </GithubAuthSetup>
  )
}

export default App
