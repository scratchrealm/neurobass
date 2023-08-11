import postNeurobassRequestFromComputeResource from "./postNeurobassRequestFromComputeResource"
import PubsubClient from './PubsubClient'
import ScriptJobManager from "./ScriptJobManager"
import { GetPubsubSubscriptionRequest, GetScriptJobsRequest } from "./types/NeurobassRequest"

class ScriptJobExecutor {
    #stopped = false
    #scriptJobManager: ScriptJobManager
    #pubsubClient: PubsubClient | undefined
    constructor(private a: { dir: string }) {
        // read computeResourceId from .neurobass-compute-resource-node.yaml in dir directory
        const container_method = process.env.CONTAINER_METHOD || 'none'
        if (!['none', 'docker', 'singularity'].includes(container_method)) {
            throw Error(`Invalid containerMethod: ${container_method}`)
        }
        if (container_method === 'none') {
            console.info('Container method is set to none. Script jobs will be executed on the host.')
            if (process.env.NEUROBASS_DANGEROUS_CONTAINER_METHOD_NONE !== 'true') {
                throw Error('Container method is set to none. Set environment variable NEUROBASS_DANGEROUS_CONTAINER_METHOD_NONE to true to allow this.')
            }
        }
        this.#scriptJobManager = new ScriptJobManager({
            dir: a.dir,
            onScriptJobCompletedOrFailed: (job) => {
                if (job.status === 'completed') {
                    console.info(`Script job completed`)
                }
                else if (job.status === 'failed') {
                    console.info(`Script job failed`)
                }
                else {
                    console.warn(`Unexpected script job status: ${job.status}`)
                }
                this._processPendingScriptJobs()
            }
        })
    }maxNumConcurrentSpaJobs
    async start() {
        console.info('Starting script job executor.')

        const reqPubsub: GetPubsubSubscriptionRequest = {
            type: 'getPubsubSubscription',
            timestamp: Date.now() / 1000,
            computeResourceId: process.env.COMPUTE_RESOURCE_ID
        }
        const respPubsub = await this._postNeurobassRequest(reqPubsub)
        if (respPubsub.type !== 'getPubsubSubscription') {
            console.warn(respPubsub)
            throw Error('Unexpected response type. Expected getPubsubSubscription')
        }

        const onPubsubMessage = (message: any) => {
            console.info(`Received pubsub message: ${message.type}`)
            if (message.type === 'newPendingScriptJob') {
                this._processPendingScriptJobs()
            }
        }
        this.#pubsubClient = new PubsubClient(respPubsub.subscriptionInfo, onPubsubMessage)

        // periodically clean up old script jobs
        const doCleanup = async () => {
            if (this.#stopped) {
                return
            }
            await this.#scriptJobManager.cleanupOldJobs()
            setTimeout(doCleanup, 1000 * 60 * 10)
        }
        doCleanup()

        // periodically check for new script jobs (and report that this node is active)
        const doCheckForNewScriptJobs = async () => {
            if (this.#stopped) {
                return
            }
            await this._processPendingScriptJobs()
            setTimeout(doCheckForNewScriptJobs, 1000 * 60 * 5)
        }
        doCheckForNewScriptJobs()
    }
    private async _processPendingScriptJobs() {
        if (this.#stopped) {
            return
        }
        const req: GetScriptJobsRequest = {
            type: 'getScriptJobs',
            timestamp: Date.now() / 1000,
            computeResourceId: process.env.COMPUTE_RESOURCE_ID,
            status: 'pending',
            nodeId: process.env.COMPUTE_RESOURCE_NODE_ID,
            nodeName: process.env.COMPUTE_RESOURCE_NODE_NAME
        }
        const resp = await this._postNeurobassRequest(req)
        if (resp) {
            if (resp.type !== 'getScriptJobs') {
                console.warn(resp)
                throw Error('Unexpected response type. Expected getScriptJobs')
            }
            const {scriptJobs} = resp
            if (scriptJobs.length > 0) {
                console.info(`Found ${scriptJobs.length} pending script jobs.`)
            }
            for (const scriptJob of scriptJobs) {
                try {
                    const initiated = await this.#scriptJobManager.initiateJob(scriptJob)
                    if (initiated) {
                        console.info(`Initiated script job: ${scriptJob.scriptJobId}`)
                    }
                }
                catch (err) {
                    console.warn(err)
                    console.info(`Unable to handle script job: ${err.message}`)
                }
            }
        }
    }
    private async _postNeurobassRequest(req: any): Promise<any> {
        return await postNeurobassRequestFromComputeResource(req, {
            computeResourceId: process.env.COMPUTE_RESOURCE_ID,
            computeResourcePrivateKey: process.env.COMPUTE_RESOURCE_PRIVATE_KEY
        })
    }
    
    async stop() {
        this.#stopped = true
        this.#scriptJobManager.stop()
        if (this.#pubsubClient) {
            this.#pubsubClient.unsubscribe()
        }
    }
}

export default ScriptJobExecutor