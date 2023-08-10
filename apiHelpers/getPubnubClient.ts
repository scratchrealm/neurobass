import Pubnub from "pubnub";

let client: Pubnub | undefined = undefined

export const getPubnubClient = async (): Promise<Pubnub | undefined> => {
    if (client) return client
    const PUBNUB_PUBLISH_KEY = process.env['PUBNUB_PUBLISH_KEY']
    const PUBNUB_SUBSCRIBE_KEY = process.env['VITE_PUBNUB_SUBSCRIBE_KEY']
    if (!PUBNUB_PUBLISH_KEY) return undefined
    if (!PUBNUB_SUBSCRIBE_KEY) return undefined
    client = new Pubnub({
        publishKey: PUBNUB_PUBLISH_KEY,
        subscribeKey: PUBNUB_SUBSCRIBE_KEY,
        userId: 'neurobass-api'
    })
    return client
}

export default getPubnubClient