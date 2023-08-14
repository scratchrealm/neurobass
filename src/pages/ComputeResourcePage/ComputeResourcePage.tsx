import { FunctionComponent, useEffect, useMemo, useState } from "react";
import ComputeResourceIdComponent from "../../ComputeResourceIdComponent";
import { fetchComputeResource } from "../../dbInterface/dbInterface";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import { timeAgoString } from "../../timeStrings";
import { NBComputeResource } from "../../types/neurobass-types";
import UserIdComponent from "../../UserIdComponent";
import ComputeResourceJobsTable from "./ComputeResourceJobsTable";

type Props = {
    width: number
    height: number
    computeResourceId: string
}

const ComputeResourcesPage: FunctionComponent<Props> = ({width, height, computeResourceId}) => {
    const [computeResource, setComputeResources] = useState<NBComputeResource>()

    const {accessToken, userId} = useGithubAuth()
    const auth = useMemo(() => (accessToken ? {githubAccessToken: accessToken, userId} : {}), [accessToken, userId])

    useEffect(() => {
        let canceled = false
        ;(async () => {
            const cr = await fetchComputeResource(computeResourceId, auth)
            if (canceled) return
            setComputeResources(cr)
        })()
        return () => {canceled = true}
    }, [computeResourceId, auth])
    return (
        <div style={{padding: 20}}>
            <h3>
                Compute resource: {computeResource?.name}
            </h3>
            <hr />
            <table className="table1" style={{maxWidth: 550}}>
                <tbody>
                    <tr>
                        <td>Compute resource name</td>
                        <td>{computeResource?.name}</td>
                    </tr>
                    <tr>
                        <td>Compute resource ID</td>
                        <td><ComputeResourceIdComponent computeResourceId={computeResourceId} /></td>
                    </tr>
                    <tr>
                        <td>Owner</td>
                        <td><UserIdComponent userId={computeResource?.ownerId || ''} /></td>
                    </tr>
                    <tr>
                        <td>Created</td>
                        <td>{timeAgoString(computeResource?.timestampCreated)}</td>
                    </tr>
                </tbody>
            </table>
            <hr />
            <p>Full ID: {computeResource?.computeResourceId}</p>
            <hr />
            <ComputeResourceJobsTable
                computeResourceId={computeResourceId}
            />
        </div>
    )
}

export default ComputeResourcesPage