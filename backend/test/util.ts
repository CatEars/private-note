import * as uuid from 'uuid'
import { Note, Log, NoteOptions } from '../src/database'

export const exampleNote: Note = {
    allowedReads: 1,
    encryptedMessage: [1, 2, 3],
    fingerprint: [1, 2, 3, 4],
    IV: [1, 2, 3, 4, 5],
    burnDate: Date.now() + 60 * 60 * 1000,
    encryptionScheme: {
        encrypt: {
            name: 'AES-GCM',
            length: 256,
        },
        fingerprint: 'SHA-512',
        keystyle: 'raw',
    },
}

export const normalOptions: NoteOptions = {
    checkAllowedReads: true,
    checkBurnDate: true,
    addAccess: true,
}

export const exampleLog: Log = {
    accessUrl: `http://localhost:3000/${uuid.v4()}`,
    ip: '127.0.0.1',
    timeOfAccess: Date.now(),
}

export const NewNote = (burnDate: number): Note => {
    return {
        allowedReads: 1,
        encryptedMessage: [1, 2, 3],
        fingerprint: [3, 2, 1],
        IV: [4, 5, 6],
        burnDate,
    }
}

export const uuidv4Regex = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i
