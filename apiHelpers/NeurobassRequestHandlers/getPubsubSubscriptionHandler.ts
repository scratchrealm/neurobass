import { GetPubsubSubscriptionRequest, GetPubsubSubscriptionResponse } from "../../src/types/NeurobassRequest";

const getPubsubSubscriptionHandler = async (request: GetPubsubSubscriptionRequest, o: {verifiedClientId?: string, verifiedUserId?: string}): Promise<GetPubsubSubscriptionResponse> => {
    if ((!o.verifiedClientId) && (!o.verifiedUserId)) {
        throw new Error('Not authorized')
    }
    if (o.verifiedClientId) {
        if (o.verifiedClientId !== request.computeResourceId) {
            throw new Error('Not authorized (compute resource ID does not match)')
        }
    }
    let subscriptionInfo: any = undefined
    if (process.env.VITE_PUBNUB_SUBSCRIBE_KEY) {
        subscriptionInfo = {
            pubnubSubscribeKey: process.env.VITE_PUBNUB_SUBSCRIBE_KEY,
            pubnubChannel: request.computeResourceId,
            pubnubUserId: o.verifiedClientId || o.verifiedUserId
        }
    }
    return {
        type: 'getPubsubSubscription',
        subscriptionInfo
    }
}

export default getPubsubSubscriptionHandler