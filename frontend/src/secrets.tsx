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
    const hash = await window.crypto.subtle.digest('SHA-512', data)
    return hash
}

export const generateKey = async () => {
    return await window.crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    )
}

export const urlencodeKey = async (key: CryptoKey) => {
    const exported = await window.crypto.subtle.exportKey('raw', key)
    const array = new Uint8Array(exported)
    const asJSArray = Array.prototype.slice.call(array)
    return encodeURIComponent(JSON.stringify(asJSArray))
}

export const urldecodeKey = async (val: string) => {
    const jsonArray = JSON.parse(decodeURIComponent(val))
    const asUint8 = new Uint8Array(jsonArray)
    return await window.crypto.subtle.importKey(
        'raw',
        asUint8,
        'AES-GCM',
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
            name: 'AES-GCM',
            length: 256,
            iv: IV,
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
            name: 'AES-GCM',
            iv: IV,
            length: 256,
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
