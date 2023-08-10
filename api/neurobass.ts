import { VercelRequest, VercelResponse } from '@vercel/node'
import githubVerifyAccessToken from '../apiHelpers/githubVerifyAccessToken'
import JSONStringifyDeterminsitic from '../apiHelpers/jsonStringifyDeterministic'
import cloneProjectHandler from '../apiHelpers/NeurobassRequestHandlers/cloneProjectHandler'
import createProjectHandler from '../apiHelpers/NeurobassRequestHandlers/createProjectHandler'
import createScriptJobHandler from '../apiHelpers/NeurobassRequestHandlers/createScriptJobHandler'
import createWorkspaceHandler from '../apiHelpers/NeurobassRequestHandlers/createWorkspaceHandler'
import deleteCompletedScriptJobsHandler from '../apiHelpers/NeurobassRequestHandlers/deleteCompletedScriptJobsHandler'
import deleteComputeResourceHandler from '../apiHelpers/NeurobassRequestHandlers/deleteComputeResourceHandler'
import deleteProjectFileHandler from '../apiHelpers/NeurobassRequestHandlers/deleteProjectFileHandler'
import deleteProjectHandler from '../apiHelpers/NeurobassRequestHandlers/deleteProjectHandler'
import deleteScriptJobHandler from '../apiHelpers/NeurobassRequestHandlers/deleteScriptJobHandler'
import deleteWorkspaceHandler from '../apiHelpers/NeurobassRequestHandlers/deleteWorkspaceHandler'
import duplicateProjectFileHandler from '../apiHelpers/NeurobassRequestHandlers/duplicateProjectFileHandler'
import getComputeResourcesHandler from '../apiHelpers/NeurobassRequestHandlers/getComputeResourcesHandler'
import getComputeResourceHandler from '../apiHelpers/NeurobassRequestHandlers/getComputeResourceHandler'
import getDataBlobHandler from '../apiHelpers/NeurobassRequestHandlers/getDataBlobHandler'
import getActiveComputeResourceNodesHandler from '../apiHelpers/NeurobassRequestHandlers/getActiveComputeResourceNodesHandler'
import getProjectFileHandler from '../apiHelpers/NeurobassRequestHandlers/getProjectFileHandler'
import getProjectFilesHandler from '../apiHelpers/NeurobassRequestHandlers/getProjectFilesHandler'
import getProjectHandler from '../apiHelpers/NeurobassRequestHandlers/getProjectHandler'
import getProjectsHandler from '../apiHelpers/NeurobassRequestHandlers/getProjectsHandler'
import getScriptJobHandler from '../apiHelpers/NeurobassRequestHandlers/getScriptJobHandler'
import getScriptJobsHandler from '../apiHelpers/NeurobassRequestHandlers/getScriptJobsHandler'
import getWorkspaceHandler from '../apiHelpers/NeurobassRequestHandlers/getWorkspaceHandler'
import getWorkspacesHandler from '../apiHelpers/NeurobassRequestHandlers/getWorkspacesHandler'
import registerComputeResourceHandler from '../apiHelpers/NeurobassRequestHandlers/registerComputeResourceHandler'
import renameProjectFileHandler from '../apiHelpers/NeurobassRequestHandlers/renameProjectFileHandler'
import setProjectFileHandler from '../apiHelpers/NeurobassRequestHandlers/setProjectFileHandler'
import setProjectPropertyHandler from '../apiHelpers/NeurobassRequestHandlers/setProjectPropertyHandler'
import setScriptJobPropertyHandler from '../apiHelpers/NeurobassRequestHandlers/setScriptJobPropertyHandler'
import setWorkspacePropertyHandler from '../apiHelpers/NeurobassRequestHandlers/setWorkspacePropertyHandler'
import setWorkspaceUsersHandler from '../apiHelpers/NeurobassRequestHandlers/setWorkspaceUsersHandler'
import getPubsubSubscriptionHandler from '../apiHelpers/NeurobassRequestHandlers/getPubsubSubscriptionHandler'
import verifySignature from '../apiHelpers/verifySignature'
import { isCloneProjectRequest, isCreateProjectRequest, isCreateScriptJobRequest, isCreateWorkspaceRequest, isDeleteCompletedScriptJobsRequest, isDeleteComputeResourceRequest, isDeleteProjectFileRequest, isDeleteProjectRequest, isDeleteScriptJobRequest, isDeleteWorkspaceRequest, isDuplicateProjectFileRequest, isGetActiveComputeResourceNodesRequest, isGetComputeResourceRequest, isGetComputeResourcesRequest, isGetDataBlobRequest, isGetScriptJobsRequest, isGetProjectFileRequest, isGetProjectFilesRequest, isGetProjectRequest, isGetProjectsRequest, isGetPubsubSubscriptionRequest, isGetScriptJobRequest, isGetWorkspaceRequest, isGetWorkspacesRequest, isNeurobassRequest, isRegisterComputeResourceRequest, isRenameProjectFileRequest, isSetProjectFileRequest, isSetProjectPropertyRequest, isSetScriptJobPropertyRequest, isSetWorkspacePropertyRequest, isSetWorkspaceUsersRequest } from '../src/types/NeurobassRequest'

const ADMIN_USER_IDS = JSON.parse(process.env.ADMIN_USER_IDS || '[]') as string[]

module.exports = (req: VercelRequest, res: VercelResponse) => {
    const {body: request} = req

    // CORS ///////////////////////////////////
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    if ([
        'http://localhost:3000',
        'http://localhost:5173',
        'https://flatironinstitute.github.io',
        'https://scratchrealm.github.io'
    ].includes(req.headers.origin || '')) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '')
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }
    ///////////////////////////////////////////

    if (!isNeurobassRequest(request)) {
        res.status(400).send(`Invalid request: ${JSON.stringify(request)}`)
        return
    }

    const { payload, fromClientId, signature, userId, githubAccessToken } = request
    const { timestamp } = payload
    const elapsed = (Date.now() / 1000) - timestamp
    if ((elapsed > 30) || (elapsed < -30)) { 
        // Note the range used to be narrower, but was running into problems
        // For example, got elapsed = -0.662
        // Not sure the best way to do this check
        throw Error(`Invalid timestamp. ${timestamp} ${Date.now() / 1000} ${elapsed}`)
    }

    (async () => {
        let verifiedClientId: string | undefined = undefined
        if (fromClientId) {
            if (!signature) throw Error('No signature provided with fromClientId')
            if (!(await verifySignature(JSONStringifyDeterminsitic(payload), fromClientId, signature))) {
                throw Error('Invalid signature')
            }
            verifiedClientId = fromClientId
        }

        let verifiedUserId: string | undefined = undefined
        if ((userId) && (userId.startsWith('github|')) && (githubAccessToken)) {
            if (!(await githubVerifyAccessToken(userId.slice('github|'.length), githubAccessToken))) {
                throw Error('Unable to verify github user ID')
            }
            verifiedUserId = userId
        }
        else if ((userId) && (userId.startsWith('admin|'))) {
            const x = userId.slice('admin|'.length)
            if (!ADMIN_USER_IDS.includes(x)) {
                throw Error('Invalid admin user ID')
            }
            if (!x.startsWith('github|')) {
                throw Error('Invalid admin user ID (does not start with github|)')
            }
            if (!(await githubVerifyAccessToken(x.slice('github|'.length), githubAccessToken))) {
                throw Error('Unable to verify github user ID (for admin)')
            }
            verifiedUserId = userId
        }
        
        if (isGetWorkspacesRequest(payload)) {
            return await getWorkspacesHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetWorkspaceRequest(payload)) {
            return await getWorkspaceHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isCreateWorkspaceRequest(payload)) {
            return await createWorkspaceHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetProjectsRequest(payload)) {
            return await getProjectsHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetProjectRequest(payload)) {
            return await getProjectHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isCreateProjectRequest(payload)) {
            return await createProjectHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isDeleteWorkspaceRequest(payload)) {
            return await deleteWorkspaceHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetProjectFilesRequest(payload)) {
            return await getProjectFilesHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isSetProjectFileRequest(payload)) {
            return await setProjectFileHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetProjectFileRequest(payload)) {
            return await getProjectFileHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isSetWorkspaceUsersRequest(payload)) {
            return await setWorkspaceUsersHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isSetWorkspacePropertyRequest(payload)) {
            return await setWorkspacePropertyHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetDataBlobRequest(payload)) {
            return await getDataBlobHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isDeleteProjectRequest(payload)) {
            return await deleteProjectHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isCloneProjectRequest(payload)) {
            return await cloneProjectHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isSetProjectPropertyRequest(payload)) {
            return await setProjectPropertyHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetComputeResourcesRequest(payload)) {
            return await getComputeResourcesHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetComputeResourceRequest(payload)) {
            return await getComputeResourceHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isRegisterComputeResourceRequest(payload)) {
            return await registerComputeResourceHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isDeleteComputeResourceRequest(payload)) {
            return await deleteComputeResourceHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isCreateScriptJobRequest(payload)) {
            return await createScriptJobHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isDeleteScriptJobRequest(payload)) {
            return await deleteScriptJobHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isDeleteCompletedScriptJobsRequest(payload)) {
            return await deleteCompletedScriptJobsHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetScriptJobRequest(payload)) {
            return await getScriptJobHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetScriptJobsRequest(payload)) {
            return await getScriptJobsHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetActiveComputeResourceNodesRequest(payload)) {
            return await getActiveComputeResourceNodesHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isSetScriptJobPropertyRequest(payload)) {
            return await setScriptJobPropertyHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isDeleteProjectFileRequest(payload)) {
            return await deleteProjectFileHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isDuplicateProjectFileRequest(payload)) {
            return await duplicateProjectFileHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isRenameProjectFileRequest(payload)) {
            return await renameProjectFileHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetPubsubSubscriptionRequest(payload)) {
            return await getPubsubSubscriptionHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else {
            throw Error(`Unexpected request type: ${(payload as any).type}`)
        }
    })().then((response) => {
        res.json(response)
    }).catch((error: Error) => {
        console.warn(error.message)
        res.status(500).send(`Error: ${error.message}`)
    })
}