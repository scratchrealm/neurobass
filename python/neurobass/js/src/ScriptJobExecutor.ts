import fs from 'fs'
import path from 'path'
import postNeurobassRequestFromComputeResource from "./postNeurobassRequestFromComputeResource"
import PubsubClient from './PubsubClient'
import ScriptJobManager from "./ScriptJobManager"
import { GetScriptJobsRequest, GetPubsubSubscriptionRequest } from "./types/NeurobassRequest"
import yaml from 'js-yaml'

export type ComputeResourceConfig = {
    compute_resource_id: string
    compute_resource_private_key: string
    node_id: string
    node_name: string
    job_slots: {
        count: number
        num_cpus: number
        ram_gb: number
        timeout_sec: number
    }[]
}

class ScriptJobExecutor {
    #stopped = false
    #scriptJobManager: ScriptJobManager
    #pubsubClient: PubsubClient | undefined
    #computeResourceConfig: ComputeResourceConfig
    constructor(private a: { dir: string }) {
        // read computeResourceId from .neurobass-compute-resource-node.yaml in dir directory
        const configYaml = fs.readFileSync(path.join(a.dir, '.neurobass-compute-resource-node.yaml'), 'utf8')
        this.#computeResourceConfig = yaml.load(configYaml) as ComputeResourceConfig
        const container_method = process.env.NEUROBASS_CONTAINER_METHOD || 'none'
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
            computeResourceConfig: this.#computeResourceConfig,
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
            computeResourceId: this.#computeResourceConfig.compute_resource_id
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
            computeResourceId: this.#computeResourceConfig.compute_resource_id,
            status: 'pending',
            nodeId: this.#computeResourceConfig.node_id,
            nodeName: this.#computeResourceConfig.node_name
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
            computeResourceId: this.#computeResourceConfig.compute_resource_id,
            computeResourcePrivateKey: this.#computeResourceConfig.compute_resource_private_key
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