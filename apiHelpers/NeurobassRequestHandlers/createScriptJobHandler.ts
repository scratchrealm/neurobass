import { CreateScriptJobRequest, CreateScriptJobResponse } from "../../src/types/NeurobassRequest";
import { isSPProjectFile, SPScriptJob } from "../../src/types/neurobass-types";
import createRandomId from "../createRandomId";
import getProject from "../getProject";
import { getMongoClient } from "../getMongoClient";
import getWorkspace from "../getWorkspace";
import getWorkspaceRole from "../getWorkspaceRole";
import removeIdField from "../removeIdField";
import getPubnubClient from "../getPubnubClient"

const createScriptJobHandler = async (request: CreateScriptJobRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<CreateScriptJobResponse> => {
    const userId = o.verifiedUserId
    const workspaceId = request.workspaceId

    const workspace = await getWorkspace(workspaceId, {useCache: false})
    const workspaceRole = getWorkspaceRole(workspace, userId)

    const canEdit = workspaceRole === 'admin' || workspaceRole === 'editor'
    if (!canEdit) {
        throw new Error('User does not have permission to create script jobs')
    }

    let computeResourceId = workspace.computeResourceId
    if (!computeResourceId) {
        computeResourceId = process.env.VITE_DEFAULT_COMPUTE_RESOURCE_ID
        if (!computeResourceId) {
            throw new Error('Workspace does not have a compute resource ID, and no default VITE_DEFAULT_COMPUTE_RESOURCE_ID is set in the environment.')
        }
    }

    const project = await getProject(request.projectId, {useCache: false})
    // important to check this
    if (project.workspaceId !== workspaceId) {
        throw new Error('Incorrect workspace ID')
    }

    const client = await getMongoClient()

    const projectFilesCollection = client.db('neurobass').collection('projectFiles')
    const projectFile = removeIdField(await projectFilesCollection.findOne({
        workspaceId,
        projectId: request.projectId,
        fileName: request.scriptFileName
    }))
    if (!projectFile) {
        throw new Error('Project file not found')
    }
    if (!isSPProjectFile(projectFile)) {
        console.warn(projectFile)
        throw new Error('Invalid projects file in database (1)')
    }

    const scriptJobId = createRandomId(8)

    const job: SPScriptJob = {
        scriptJobId,
        workspaceId,
        projectId: request.projectId,
        userId,
        scriptFileName: request.scriptFileName,
        status: 'pending',
        computeResourceId,
        timestampCreated: Date.now() / 1000,
        timestampModified: Date.now() / 1000
    }
    if (request.requiredResources) {
        job.requiredResources = request.requiredResources
    }
    const scriptJobsCollection = client.db('neurobass').collection('scriptJobs')
    await scriptJobsCollection.insertOne(job)

    const pnClient = await getPubnubClient()
    if (pnClient) {
        await pnClient.publish({
            channel: computeResourceId,
            message: {
                type: 'newPendingScriptJob',
                workspaceId,
                projectId: request.projectId,
                scriptFileName: request.scriptFileName,
                scriptJobId
            }
        })
    }

    return {
        type: 'createScriptJob',
        scriptJobId
    }
}

export default createScriptJobHandler