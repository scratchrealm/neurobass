import { GetScriptJobRequest, GetScriptJobResponse } from "../../src/types/NeurobassRequest";
import { isSPScriptJob } from "../../src/types/neurobass-types";
import getProject from "../getProject";
import { getMongoClient } from "../getMongoClient";
import getWorkspace from "../getWorkspace";
import { userCanReadWorkspace } from "../permissions";
import removeIdField from "../removeIdField";

const getScriptJob = async (request: GetScriptJobRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<GetScriptJobResponse> => {
    const client = await getMongoClient()
    const scriptJobsCollection = client.db('neurobass').collection('scriptJobs')

    const project = await getProject(request.projectId, {useCache: true})
    
    const workspaceId = project.workspaceId
    const workspace = await getWorkspace(workspaceId, {useCache: true})
    if (!userCanReadWorkspace(workspace, o.verifiedUserId, o.verifiedClientId)) {
        throw new Error('User does not have permission to read this workspace')
    }
    if (request.workspaceId !== workspaceId) {
        throw new Error('workspaceId does not match project.workspaceId')
    }
    
    const scriptJob = removeIdField(await scriptJobsCollection.findOne({
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        scriptJobId: request.scriptJobId
    }))
    if (!scriptJob) {
        throw new Error(`No script job with ID ${request.scriptJobId}`)
    }
    if (!isSPScriptJob(scriptJob)) {
        console.warn(scriptJob)
        throw new Error('Invalid script job in database (2)')
    }
    return {
        type: 'getScriptJob',
        scriptJob
    }
}

export default getScriptJob