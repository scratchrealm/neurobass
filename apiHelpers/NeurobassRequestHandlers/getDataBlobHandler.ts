import { GetDataBlobRequest, GetDataBlobResponse } from "../../src/types/NeurobassRequest";
import { isNBDataBlob } from "../../src/types/neurobass-types";
import { getMongoClient } from "../getMongoClient";
import removeIdField from "../removeIdField";

const getDataBlobHandler = async (request: GetDataBlobRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<GetDataBlobResponse> => {
    const client = await getMongoClient()
    const dataBlobsCollection = client.db('neurobass').collection('dataBlobs')

    // For now we allow anonymous users to read data blobs because this is needed for the MCMC Monitor to work
    // const workspace = await getWorkspace(request.workspaceId, {useCache: true})
    // if (!userCanReadWorkspace(workspace, o.verifiedUserId, o.verifiedClientId)) {
    //     throw new Error('User does not have permission to read this workspace')
    // }
    
    const dataBlob = removeIdField(await dataBlobsCollection.findOne({
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        sha1: request.sha1
    }))
    if (!dataBlob) {
        throw Error('Data blob not found')
    }
    if (!isNBDataBlob(dataBlob)) {
        console.warn(dataBlob)
        throw new Error('Invalid data blob in database')
    }

    return {
        type: 'getDataBlob',
        content: dataBlob.content
    }
}

export default getDataBlobHandler