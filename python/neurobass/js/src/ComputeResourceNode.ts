import JobExecutor from "./JobExecutor"

class ComputeResourceNode {
    #jobExecutor: JobExecutor
    constructor(private a: { dir: string }) {
        this.#jobExecutor = new JobExecutor({ dir: a.dir })
    }
    async start() {
        console.info('Starting compute resource node.')
        this.#jobExecutor.start()
    }
    async stop() {
        await this.#jobExecutor.stop()
    }
}

export default ComputeResourceNode