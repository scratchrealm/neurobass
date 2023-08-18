import fs from 'fs'
import postNeurobassRequestFromComputeResource from "./postNeurobassRequestFromComputeResource"
import PubsubClient from './PubsubClient'
import JobManager from "./JobManager"
import { GetPubsubSubscriptionRequest, GetJobsRequest, SetComputeResourceSpecRequest } from "./types/NeurobassRequest"

class JobExecutor {
    #stopped = false
    #jobManager: JobManager
    #pubsubClient: PubsubClient | undefined
    constructor(private a: { dir: string }) {
        // read computeResourceId from .neurobass-compute-resource-node.yaml in dir directory
        const container_method = process.env.CONTAINER_METHOD || 'none'
        if (!['none', 'docker', 'singularity'].includes(container_method)) {
            throw Error(`Invalid containerMethod: ${container_method}`)
        }
        if (container_method === 'none') {
            console.info('Container method is set to none. Jobs will be executed on the host.')
            if (process.env.NEUROBASS_DANGEROUS_CONTAINER_METHOD_NONE !== 'true') {
                throw Error('Container method is set to none. Set environment variable NEUROBASS_DANGEROUS_CONTAINER_METHOD_NONE to true to allow this.')
            }
        }
        this.#jobManager = new JobManager({
            dir: a.dir,
            onJobCompletedOrFailed: (job) => {
                if (job.status === 'completed') {
                    console.info(`Job completed`)
                }
                else if (job.status === 'failed') {
                    console.info(`Job failed`)
                }
                else {
                    console.warn(`Unexpected job status: ${job.status}`)
                }
                this._processPendingJobs()
            }
        })
    }maxNumConcurrentSpaJobs
    async start() {
        console.info('Starting job executor.')

        const specJsonFname = `${this.a.dir}/spec.json`
        if (fs.existsSync(specJsonFname)) {
            const spec = JSON.parse(fs.readFileSync(specJsonFname, 'utf8'))
            const reqSpec: SetComputeResourceSpecRequest = {
                type: 'setComputeResourceSpec',
                timestamp: Date.now() / 1000,
                computeResourceId: process.env.COMPUTE_RESOURCE_ID,
                spec
            }
            const respSpec = await this._postNeurobassRequest(reqSpec)
            if (!respSpec) {
                console.warn(JSON.stringify(spec, null, 4))
                throw Error('Unable to set compute resource spec')
            }
            if (respSpec.type !== 'setComputeResourceSpec') {
                console.warn(respSpec)
                throw Error('Unexpected response type. Expected setComputeResourceSpec')
            }
        }

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
            if (message.type === 'newPendingJob') {
                this._processPendingJobs()
            }
        }
        this.#pubsubClient = new PubsubClient(respPubsub.subscriptionInfo, onPubsubMessage)

        // periodically clean up old jobs
        const doCleanup = async () => {
            if (this.#stopped) {
                return
            }
            await this.#jobManager.cleanupOldJobs()
            setTimeout(doCleanup, 1000 * 60 * 10)
        }
        doCleanup()

        // periodically check for new jobs (and report that this node is active)
        const doCheckForNewJobs = async () => {
            if (this.#stopped) {
                return
            }
            await this._processPendingJobs()
            setTimeout(doCheckForNewJobs, 1000 * 60 * 5)
        }
        doCheckForNewJobs()
    }
    private async _processPendingJobs() {
        if (this.#stopped) {
            return
        }
        const req: GetJobsRequest = {
            type: 'getJobs',
            timestamp: Date.now() / 1000,
            computeResourceId: process.env.COMPUTE_RESOURCE_ID,
            status: 'pending',
            nodeId: process.env.COMPUTE_RESOURCE_NODE_ID,
            nodeName: process.env.COMPUTE_RESOURCE_NODE_NAME
        }
        const resp = await this._postNeurobassRequest(req)
        if (resp) {
            if (resp.type !== 'getJobs') {
                console.warn(resp)
                throw Error('Unexpected response type. Expected getJobs')
            }
            const {jobs} = resp
            if (jobs.length > 0) {
                console.info(`Found ${jobs.length} pending jobs.`)
            }
            for (const job of jobs) {
                try {
                    const initiated = await this.#jobManager.initiateJob(job)
                    if (initiated) {
                        console.info(`Initiated job: ${job.jobId}`)
                    }
                }
                catch (err) {
                    console.warn(err)
                    console.info(`Unable to handle job: ${err.message}`)
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
        this.#jobManager.stop()
        if (this.#pubsubClient) {
            this.#pubsubClient.unsubscribe()
        }
    }
}

export default JobExecutor