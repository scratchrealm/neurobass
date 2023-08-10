import crypto from 'crypto'
import nacl from 'tweetnacl'

const verifySignature = async (payload: any, publicKeyHex: string, signature: string) => {
    const messageHash = stringSha1(payload)
    const messageHashBuffer = Buffer.from(messageHash, 'hex')
    const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex')
    const signatureBuffer = Buffer.from(signature, 'hex')
    const okay = nacl.sign.detached.verify(messageHashBuffer, signatureBuffer, publicKeyBuffer)
    return okay
}

const stringSha1 = (s: string) => {
    const shasum = crypto.createHash('sha1')
    shasum.update(s)
    return shasum.digest('hex')
}

export default verifySignature