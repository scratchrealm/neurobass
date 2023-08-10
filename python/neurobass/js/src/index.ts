import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import ComputeResourceNode from './ComputeResourceNode'

const main = () => {
    yargs(hideBin(process.argv))
        .command('start', 'Start compute resource node', (yargs) => {
            return yargs
        }, (argv) => {
            const dir: string = argv.dir as string
            start({ dir })
        })
        .option('dir', {
            type: 'string',
            description: 'Directory of compute resource node'
        })
        .strictCommands()
        .demandCommand(1)
        .parse()
}

let computeResourceNode: ComputeResourceNode
function start({ dir }: { dir: string }) {
    computeResourceNode = new ComputeResourceNode({ dir })
    computeResourceNode.start()
}

process.on('SIGINT', function () {
    if (computeResourceNode) {
        console.info('Stopping compute resource node.')
        computeResourceNode.stop().then(() => {
            console.info('Exiting.')
            process.exit()
        })
    }
    setTimeout(() => {
        // exit no matter what after a few seconds
        process.exit()
    }, 6000)
})

main()