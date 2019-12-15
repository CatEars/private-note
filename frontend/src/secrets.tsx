const sameArray = (array1: any, array2: any) => {
    return (
        array1.length === array2.length &&
        array1.every((elem: any, idx: number) => elem === array2[idx])
    )
}

const getRandomSalt = () => {
    const array = new Uint32Array(12)
    window.crypto.getRandomValues(array)
    return array
}

const getRandomIV = () => {
    const array = new Uint32Array(12)
    window.crypto.getRandomValues(array)
    return array
}

const generateKey = async (password: string, salt: any) => {
    const encoder = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    )
    const key = await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-512',
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256,
        },
        false,
        ['encrypt', 'decrypt']
    )

    return key
}

const fingerprint = async (message: string) => {
    const data = new TextEncoder().encode(message)
    const hash = await window.crypto.subtle.digest('SHA-512', data)
    return hash
}

export const encryptMessage = async (message: string, password: string) => {
    const salt = getRandomSalt()
    const IV = getRandomIV()
    const key = await generateKey(password, salt)
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
        salt,
        fingerprint: digest,
    }
}

export const decryptMessage = async (password: string, params: any) => {
    const { encryptedMessage, IV, salt, fingerprint: digest } = params

    const key = await generateKey(password, salt)
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
    const decryptDigest = new Uint32Array(
        await fingerprint(new TextDecoder().decode(decrypted))
    )
    const origDigest = new Uint32Array(digest)
    if (!sameArray(decryptDigest, origDigest)) {
        // Technically AES-GCM already contains an integrity check but I want to
        // extend the api so that it records what algorithms have been used
        // for key derivation and encryption. Therefore I do not want to rely on AES-GCM

        throw new Error('Digest are not matching. Wrong message obtained...')
    }

    return decodedMessage
}
