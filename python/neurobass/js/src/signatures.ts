import nacl from 'tweetnacl'
import { Buffer } from 'buffer'
import crypto from 'crypto'

export const signMessage = async (msg: any, publicKeyHex: string, privateKeyHex: string): Promise<string> => {
    // by default we use a SHA-1 prehash of stringified message stored as hex string followed by ed25519 signing
    const messageHash = stringSha1(stringifyDeterministicWithSortedKeys(msg))
    const messageHashBuffer = Buffer.from(messageHash.toString(), 'hex')
    const privateKeyBuffer = Buffer.from(privateKeyHex.toString() + publicKeyHex.toString(), 'hex')
    const signature = nacl.sign.detached(messageHashBuffer, privateKeyBuffer)
    const signatureHex = Buffer.from(signature).toString('hex')
    const okay = await verifySignature(msg, publicKeyHex, signatureHex)
    if (!okay) {
        throw Error('Problem verifying message signature in signMessageNew')
    }
    return signatureHex
}

export const verifySignature = async (msg: any, publicKeyHex: string, signature: string): Promise<boolean> => {
    // by default we use a SHA-1 prehash of stringified message stored as hex string followed by ed25519 signing
    const messageHash = stringSha1(stringifyDeterministicWithSortedKeys(msg))
    const messageHashBuffer = Buffer.from(messageHash.toString(), 'hex')
    const publicKeyBuffer = Buffer.from(publicKeyHex.toString(), 'hex')
    const signatureBuffer = Buffer.from(signature.toString(), 'hex')
    const okay = nacl.sign.detached.verify(messageHashBuffer, signatureBuffer, publicKeyBuffer)
    return okay
}

export const stringSha1 = (x: string): string => {
    const sha1sum = crypto.createHash('sha1')
    sha1sum.update(x)
    return sha1sum.digest('hex')
}

// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
export const stringifyDeterministicWithSortedKeys = ( obj: any ) => {
    const allKeys: string[] = []
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort()
    const space = undefined
    return JSON.stringify(obj, allKeys, space)
}
// Example: stringifyDeterministicWithSortedKeys({b: 1, a: 0, d: [3, 5, {y: 1, x: 0}], c: '55'}) => `{"a":0,"b":1,"c":"55","d":[3,5,{"x":0,"y":1}]}`