import { isComputeResourceSpec } from "../../src/types/neurobass-types";
import { GetComputeResourceSpecRequest, GetComputeResourceSpecResponse } from "../../src/types/NeurobassRequest";
import { getMongoClient } from "../getMongoClient";
import removeIdField from '../removeIdField';

const getComputeResourceSpecHandler = async (request: GetComputeResourceSpecRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<GetComputeResourceSpecResponse> => {
    const client = await getMongoClient()

    const computeResourceSpecsCollection = client.db('neurobass').collection('computeResourceSpecs')

    const doc = removeIdField(await computeResourceSpecsCollection.findOne({
        computeResourceId: request.computeResourceId
    }))
    if (!doc) {
        throw new Error(`No compute resource spec found for computeResourceId: ${request.computeResourceId}`)
    }
    if (!isComputeResourceSpec(doc.spec)) {
        console.warn(doc.spec)
        throw Error('Invalid compute resource spec in database (1)')
    }

    return {
        type: 'getComputeResourceSpec',
        spec: doc.spec
    }
}

export default getComputeResourceSpecHandler