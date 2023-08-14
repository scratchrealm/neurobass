import { GetProjectsRequest, GetProjectsResponse } from "../../src/types/NeurobassRequest";
import { isNBProject, NBProject } from "../../src/types/neurobass-types";
import { getMongoClient } from "../getMongoClient";
import getWorkspace from "../getWorkspace";
import { userCanReadWorkspace } from "../permissions";
import removeIdField from "../removeIdField";

const getProjectsHandler = async (request: GetProjectsRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<GetProjectsResponse> => {
    const client = await getMongoClient()
    const projectsCollection = client.db('neurobass').collection('projects')

    const workspace = await getWorkspace(request.workspaceId, {useCache: true})
    if (!userCanReadWorkspace(workspace, o.verifiedUserId, o.verifiedClientId)) {
        throw new Error('User does not have permission to read this workspace')
    }
    
    const projects = removeIdField(await projectsCollection.find({
        workspaceId: request.workspaceId
    }).toArray())
    for (const project of projects) {
        if (!isNBProject(project)) {
            console.warn(project)
            throw new Error('Invalid project in database')
        }
    }
    // sort projects by name
    (projects as NBProject[]).sort((p1, p2) => (
        p1.name.localeCompare(p2.name)
    ))
    return {
        type: 'getProjects',
        projects
    }
}

export default getProjectsHandler