import { VercelRequest, VercelResponse } from '@vercel/node'
import githubVerifyAccessToken from '../apiHelpers/githubVerifyAccessToken'
import JSONStringifyDeterminsitic from '../apiHelpers/jsonStringifyDeterministic'
import createProjectHandler from '../apiHelpers/NeurobassRequestHandlers/createProjectHandler'
import createJobHandler from '../apiHelpers/NeurobassRequestHandlers/createJobHandler'
import createWorkspaceHandler from '../apiHelpers/NeurobassRequestHandlers/createWorkspaceHandler'
import deleteComputeResourceHandler from '../apiHelpers/NeurobassRequestHandlers/deleteComputeResourceHandler'
import deleteFileHandler from '../apiHelpers/NeurobassRequestHandlers/deleteFileHandler'
import deleteProjectHandler from '../apiHelpers/NeurobassRequestHandlers/deleteProjectHandler'
import deleteJobHandler from '../apiHelpers/NeurobassRequestHandlers/deleteJobHandler'
import deleteWorkspaceHandler from '../apiHelpers/NeurobassRequestHandlers/deleteWorkspaceHandler'
import duplicateFileHandler from '../apiHelpers/NeurobassRequestHandlers/duplicateFileHandler'
import getComputeResourcesHandler from '../apiHelpers/NeurobassRequestHandlers/getComputeResourcesHandler'
import getComputeResourceHandler from '../apiHelpers/NeurobassRequestHandlers/getComputeResourceHandler'
import getDataBlobHandler from '../apiHelpers/NeurobassRequestHandlers/getDataBlobHandler'
import getActiveComputeResourceNodesHandler from '../apiHelpers/NeurobassRequestHandlers/getActiveComputeResourceNodesHandler'
import getFileHandler from '../apiHelpers/NeurobassRequestHandlers/getFileHandler'
import getFilesHandler from '../apiHelpers/NeurobassRequestHandlers/getFilesHandler'
import getProjectHandler from '../apiHelpers/NeurobassRequestHandlers/getProjectHandler'
import getProjectsHandler from '../apiHelpers/NeurobassRequestHandlers/getProjectsHandler'
import getJobHandler from '../apiHelpers/NeurobassRequestHandlers/getJobHandler'
import getJobsHandler from '../apiHelpers/NeurobassRequestHandlers/getJobsHandler'
import getWorkspaceHandler from '../apiHelpers/NeurobassRequestHandlers/getWorkspaceHandler'
import getWorkspacesHandler from '../apiHelpers/NeurobassRequestHandlers/getWorkspacesHandler'
import registerComputeResourceHandler from '../apiHelpers/NeurobassRequestHandlers/registerComputeResourceHandler'
import renameFileHandler from '../apiHelpers/NeurobassRequestHandlers/renameFileHandler'
import setFileHandler from '../apiHelpers/NeurobassRequestHandlers/setFileHandler'
import setProjectPropertyHandler from '../apiHelpers/NeurobassRequestHandlers/setProjectPropertyHandler'
import setJobPropertyHandler from '../apiHelpers/NeurobassRequestHandlers/setJobPropertyHandler'
import setWorkspacePropertyHandler from '../apiHelpers/NeurobassRequestHandlers/setWorkspacePropertyHandler'
import setWorkspaceUsersHandler from '../apiHelpers/NeurobassRequestHandlers/setWorkspaceUsersHandler'
import getPubsubSubscriptionHandler from '../apiHelpers/NeurobassRequestHandlers/getPubsubSubscriptionHandler'
import setComputeResourceSpecHandler from '../apiHelpers/NeurobassRequestHandlers/setComputeResourceSpecHandler'
import getComputeResourceSpecHandler from '../apiHelpers/NeurobassRequestHandlers/getComputeResourceSpecHandler'
import verifySignature from '../apiHelpers/verifySignature'
import { isCreateProjectRequest, isCreateJobRequest, isCreateWorkspaceRequest, isDeleteComputeResourceRequest, isDeleteFileRequest, isDeleteProjectRequest, isDeleteJobRequest, isDeleteWorkspaceRequest, isDuplicateFileRequest, isGetActiveComputeResourceNodesRequest, isGetComputeResourceRequest, isGetComputeResourcesRequest, isGetDataBlobRequest, isGetJobsRequest, isGetFileRequest, isGetFilesRequest, isGetProjectRequest, isGetProjectsRequest, isGetPubsubSubscriptionRequest, isGetJobRequest, isGetWorkspaceRequest, isGetWorkspacesRequest, isNeurobassRequest, isRegisterComputeResourceRequest, isRenameFileRequest, isSetFileRequest, isSetProjectPropertyRequest, isSetJobPropertyRequest, isSetWorkspacePropertyRequest, isSetWorkspaceUsersRequest, isSetComputeResourceSpecRequest, isGetComputeResourceSpecRequest } from '../src/types/NeurobassRequest'

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
        else if (isGetFilesRequest(payload)) {
            return await getFilesHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isSetFileRequest(payload)) {
            return await setFileHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetFileRequest(payload)) {
            return await getFileHandler(payload, {verifiedClientId, verifiedUserId})
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
        else if (isCreateJobRequest(payload)) {
            return await createJobHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isDeleteJobRequest(payload)) {
            return await deleteJobHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetJobRequest(payload)) {
            return await getJobHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetJobsRequest(payload)) {
            return await getJobsHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetActiveComputeResourceNodesRequest(payload)) {
            return await getActiveComputeResourceNodesHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isSetJobPropertyRequest(payload)) {
            return await setJobPropertyHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isDeleteFileRequest(payload)) {
            return await deleteFileHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isDuplicateFileRequest(payload)) {
            return await duplicateFileHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isRenameFileRequest(payload)) {
            return await renameFileHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetPubsubSubscriptionRequest(payload)) {
            return await getPubsubSubscriptionHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isSetComputeResourceSpecRequest(payload)) {
            return await setComputeResourceSpecHandler(payload, {verifiedClientId, verifiedUserId})
        }
        else if (isGetComputeResourceSpecRequest(payload)) {
            return await getComputeResourceSpecHandler(payload, {verifiedClientId, verifiedUserId})
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