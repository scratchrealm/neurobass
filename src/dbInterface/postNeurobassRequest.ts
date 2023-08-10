import { isNeurobassResponse, NeurobassRequest, NeurobassRequestPayload, NeurobassResponse } from "../types/NeurobassRequest";

const postNeurobassRequest = async (req: NeurobassRequestPayload, o: {userId?: string, githubAccessToken?: string}): Promise<NeurobassResponse> => {
    const rr: NeurobassRequest = {
        payload: req
    }
    if ((o.userId) && (o.githubAccessToken)) {
        rr.githubAccessToken = o.githubAccessToken
        rr.userId = o.userId
    }
    const resp = await fetch('/api/neurobass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rr),
    })
    const responseText = await resp.text()
    let responseData: any
    try {
        responseData = JSON.parse(responseText)
    } catch (e) {
        console.error(responseText)
        throw Error('Problem parsing neurobass response')
    }
    if (!isNeurobassResponse(responseData)) {
        console.warn(JSON.stringify(responseData, null, 2))
        throw Error('Unexpected neurobass response')
    }
    return responseData
}

export default postNeurobassRequest