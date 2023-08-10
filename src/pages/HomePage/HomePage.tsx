import { FunctionComponent } from "react";
import Hyperlink from "../../components/Hyperlink";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import useRoute from "../../useRoute";
import WorkspacesMenuBar from "./WorkspacesMenuBar";
import WorkspacesTable from "./WorkspacesTable";

type Props = {
    width: number
    height: number
}

const HomePage: FunctionComponent<Props> = ({width, height}) => {
    const { setRoute } = useRoute()
    const W = Math.min(800, width - 40)
    const {userId} = useGithubAuth()
    return (
        <div className="homepage" style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <div style={{position: 'absolute', left: (width - W) / 2, width: W, border: 'solid 1px lightgray'}}>
                <div style={{padding: 20}}>
                    <h1 style={{textAlign: 'center'}}>Neurobass</h1>
                    <p style={{textAlign: 'center'}}>
                        Create, run, and share neuroscience analyses. <Hyperlink onClick={() => setRoute({page: 'about'})}>Learn more...</Hyperlink>
                    </p>
                    <p>This software is a prototype.</p>
                    <hr />
                    <h2>Community Workspaces</h2>
                    <WorkspacesTable filter="community" />
                    <div>&nbsp;</div>
                    <div>&nbsp;</div>
                    <hr />
                    <h2>Your Workspaces</h2>
                    {
                        userId ? (
                            <>
                                <WorkspacesMenuBar />
                                <WorkspacesTable filter="user" />
                                <p><Hyperlink onClick={() => setRoute({page: 'compute-resources'})}>Manage your compute resources</Hyperlink></p>
                            </>
                        ) : (
                            <p>To view your workspaces, log in using the button at the top of this window.</p>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default HomePage