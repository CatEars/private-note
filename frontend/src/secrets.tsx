import * as hex from './hex'

const KEYSTYLE = 'raw'
const ENCRYPT_PARAMS = {
    name: 'AES-GCM',
    length: 256,
}
const FINGERPRINT_MODE = 'SHA-512'

const sameArray = (array1: any, array2: any) => {
    return (
        array1.length === array2.length &&
        array1.every((elem: any, idx: number) => elem === array2[idx])
    )
}

const getRandomIV = () => {
    const array = new Uint8Array(48)
    window.crypto.getRandomValues(array)
    return array
}

const fingerprint = async (message: string) => {
    const data = new TextEncoder().encode(message)
    const hash = await window.crypto.subtle.digest(FINGERPRINT_MODE, data)
    return hash
}

export const generateKey = async () => {
    return await window.crypto.subtle.generateKey(ENCRYPT_PARAMS, true, [
        'encrypt',
        'decrypt',
    ])
}

export const urlencodeKey = async (key: CryptoKey) => {
    const exported = await window.crypto.subtle.exportKey(KEYSTYLE, key)
    const array = new Uint8Array(exported)
    const asJSArray = Array.prototype.slice.call(array)
    return hex.hexEncode(asJSArray)
}

export const urldecodeKey = async (val: string) => {
    const parsedArray = hex.hexDecode(val)
    const asUint8 = new Uint8Array(parsedArray)
    return await window.crypto.subtle.importKey(
        KEYSTYLE,
        asUint8,
        ENCRYPT_PARAMS.name,
        true,
        ['encrypt', 'decrypt']
    )
}

export const encryptMessage = async (message: string, key: CryptoKey) => {
    const IV = getRandomIV()
    const encoder = new TextEncoder()
    const digest = await fingerprint(message)
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: ENCRYPT_PARAMS.name,
            iv: IV,
            length: ENCRYPT_PARAMS.length,
        },
        key,
        encoder.encode(message)
    )

    return {
        encryptedMessage: encrypted,
        IV,
        fingerprint: digest,
    }
}

export const decryptMessage = async (key: CryptoKey, params: any) => {
    const { encryptedMessage, IV, fingerprint: digest } = params

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: ENCRYPT_PARAMS.name,
            iv: IV,
            length: ENCRYPT_PARAMS.length,
        },
        key,
        encryptedMessage
    )

    const decodedMessage = new TextDecoder().decode(decrypted)
    const decryptDigest = new Uint32Array(await fingerprint(decodedMessage))
    const origDigest = new Uint32Array(digest)
    if (!sameArray(decryptDigest, origDigest)) {
        // Technically AES-GCM already contains an integrity check but I want to
        // extend the api so that it records what algorithms have been used
        // for key derivation and encryption. Therefore I do not want to rely on AES-GCM

        throw new Error('Digests are not matching. Wrong message obtained...')
    }

    return decodedMessage
}

export const getEncryptionScheme = () => ({
    encrypt: ENCRYPT_PARAMS,
    fingerprint: FINGERPRINT_MODE,
    keystyle: KEYSTYLE,
})
