import { GetFileRequest, GetFileResponse } from "../../src/types/NeurobassRequest";
import { isNBFile } from "../../src/types/neurobass-types";
import { getMongoClient } from "../getMongoClient";
import removeIdField from "../removeIdField";

const getFileHandler = async (request: GetFileRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<GetFileResponse> => {
    const client = await getMongoClient()
    const filesCollection = client.db('neurobass').collection('files')
    
    const file = removeIdField(await filesCollection.findOne({
        projectId: request.projectId,
        fileName: request.fileName
    }))
    if (!file) {
        throw Error('Project file not found')
    }
    if (!isNBFile(file)) {
        console.warn(file)
        throw new Error('Invalid project file in database (2)')
    }

    // For now we allow anonymous users to read project files because this is needed for the MCMC Monitor to work
    // const workspace = await getWorkspace(file.workspaceId, {useCache: true})
    // if (!userCanReadWorkspace(workspace, o.verifiedUserId, o.verifiedClientId)) {
    //     throw new Error('User does not have permission to read this workspace')
    // }

    return {
        type: 'getFile',
        file
    }
}

export default getFileHandler