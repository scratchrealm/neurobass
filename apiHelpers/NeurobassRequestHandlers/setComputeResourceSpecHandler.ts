import { SetComputeResourceSpecRequest, SetComputeResourceSpecResponse } from "../../src/types/NeurobassRequest";
import { getMongoClient } from "../getMongoClient";

const setComputeResourceSpecHandler = async (request: SetComputeResourceSpecRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<SetComputeResourceSpecResponse> => {
    const {verifiedClientId} = o

    if (!verifiedClientId) {
        throw new Error('Only compute resources can set compute resource spec')
    }

    if (request.computeResourceId !== verifiedClientId) {
        throw new Error(`computeResourceId ${request.computeResourceId} does not match verifiedClientId ${verifiedClientId}`)
    }

    const client = await getMongoClient()

    const computeResourceSpecsCollection = client.db('neurobass').collection('computeResourceSpecs')

    await computeResourceSpecsCollection.deleteMany({
        computeResourceId: request.computeResourceId
    })

    await computeResourceSpecsCollection.insertOne({
        computeResourceId: request.computeResourceId,
        spec: request.spec
    })

    return {
        type: 'setComputeResourceSpec'
    }
}

export default setComputeResourceSpecHandler