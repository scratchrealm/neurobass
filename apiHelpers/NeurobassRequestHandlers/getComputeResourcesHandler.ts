import { GetComputeResourcesRequest, GetComputeResourcesResponse } from "../../src/types/NeurobassRequest";
import { isSPComputeResource } from "../../src/types/neurobass-types";
import { getMongoClient } from "../getMongoClient";
import removeIdField from "../removeIdField";

const getComputeResourcesHandler = async (request: GetComputeResourcesRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<GetComputeResourcesResponse> => {
    const userId = o.verifiedUserId

    const client = await getMongoClient()
    const computeResourcesCollection = client.db('neurobass').collection('computeResources')
    
    const computeResources = removeIdField(await computeResourcesCollection.find({ownerId: userId}).toArray())
    for (const cr of computeResources) {
        if (!isSPComputeResource(cr)) {
            console.warn(cr)
            throw new Error('Invalid compute resource in database (1)')
        }
    }
    return {
        type: 'getComputeResources',
        computeResources
    }
}

export default getComputeResourcesHandler