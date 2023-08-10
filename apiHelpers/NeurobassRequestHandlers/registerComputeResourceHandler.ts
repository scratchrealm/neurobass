import { RegisterComputeResourceRequest, RegisterComputeResourceResponse } from "../../src/types/NeurobassRequest";
import { SPComputeResource } from "../../src/types/neurobass-types";
import { getMongoClient } from "../getMongoClient";
import JSONStringifyDeterministic from "../jsonStringifyDeterministic";
import removeIdField from "../removeIdField";
import verifySignature from "../verifySignature";

const registerComputeResourceHandler = async (request: RegisterComputeResourceRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<RegisterComputeResourceResponse> => {
    const userId = o.verifiedUserId
    if (!userId) {
        throw new Error('You must be logged in to register a compute resource')
    }
    const client = await getMongoClient()
    const computeResourcesCollection = client.db('neurobass').collection('computeResources')

    const computeResourceId = request.computeResourceId
    const resourceCode = request.resourceCode
    if (!(await verifyResourceCode(computeResourceId, resourceCode))) {
        throw new Error('Invalid resource code')
    }

    const cr = removeIdField(await computeResourcesCollection.findOne({computeResourceId}))
    if (cr) {
        await computeResourcesCollection.updateOne({computeResourceId}, {$set: {
            ownerId: o.verifiedUserId,
            name: request.name,
            timestampCreated: Date.now() / 1000
        }})
    }
    else {
        const x: SPComputeResource = {
            computeResourceId,
            ownerId: userId,
            name: request.name,
            timestampCreated: Date.now() / 1000
        }
        await computeResourcesCollection.insertOne(x)
    }
    
    return {
        type: 'registerComputeResource'
    }
}

const verifyResourceCode = async (computeResourceId: string, resourceCode: string): Promise<boolean> => {
    const timestamp = parseInt(resourceCode.split('-')[0])
    // check that timestamp is within 5 minutes of current time
    if (Math.abs(timestamp - Date.now() / 1000) > 300) {
        return false
    }
    const signature = resourceCode.split('-')[1]
    if (!(await verifySignature(JSONStringifyDeterministic({timestamp}), computeResourceId, signature))) {
        return false
    }
    return true
}

export default registerComputeResourceHandler