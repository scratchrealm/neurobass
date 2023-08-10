import { signMessage } from "./signatures";
import { isNeurobassResponse, NeurobassRequest, NeurobassRequestPayload, NeurobassResponse } from "./types/NeurobassRequest";

const postNeurobassRequestFromComputeResource = async (req: NeurobassRequestPayload, o: {computeResourceId: string, computeResourcePrivateKey: string}): Promise<NeurobassResponse | undefined> => {
    const rr: NeurobassRequest = {
        payload: req,
        fromClientId: o.computeResourceId,
        signature: await signMessage(req, o.computeResourceId, o.computeResourcePrivateKey)
    }

    const neurobassUrl = process.env.NEUROBASS_URL || 'https://neurobass.vercel.app'
    // const neurobassUrl = process.env.NEUROBASS_URL || 'http://localhost:3000'

    try {
        const resp = await fetch(`${neurobassUrl}/api/neurobass`, {
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
        }
        catch (err) {
            console.warn(responseText)
            throw Error('Unable to parse neurobass response')
        }
        if (!isNeurobassResponse(responseData)) {
            console.warn(JSON.stringify(responseData, null, 2))
            throw Error('Unexpected neurobass response')
        }
        return responseData
    }
    catch (err) {
        console.warn(err)
        console.info(`Unable to post neurobass request: ${err.message}`)
        return undefined
    }
}

export default postNeurobassRequestFromComputeResource