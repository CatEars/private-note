import 'jest'
import * as _ from 'lodash'

import { InMemoryDatabase, Note, Log, NoteOptions } from '../src/database'

const exampleNote = {
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

const normalOptions: NoteOptions = {
    checkAllowedReads: true,
    checkBurnDate: true,
    addAccess: true,
}

test('Can create db', () => {
    const db = new InMemoryDatabase()
})

test('Can start and stop db without issues', async done => {
    const db = new InMemoryDatabase()
    await db.startDatabase()
    await db.stopDatabase()
    done()
})

test('Can store a note - normal case', async done => {
    const db = new InMemoryDatabase()
    const id = await db.storeNote(exampleNote)
    expect(id).toMatch(
        /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i
    )
    const theNote = await db.getNote(id, normalOptions)
    expect(theNote).toEqual(exampleNote)
    done()
})

test('Throws error on retrieve twice', async done => {
    const db = new InMemoryDatabase()
    const id = await db.storeNote(exampleNote)
    const theNote = await db.getNote(id, normalOptions)
    expect(theNote).toEqual(exampleNote)
    try {
        await db.getNote(id, normalOptions)
        fail()
    } catch (err) {}
    done()
})

test('CheckAllowedReads:false allows one to read multiple times', async done => {
    const multiRead = _.assign({}, normalOptions, { checkAllowedReads: false })

    const db = new InMemoryDatabase()
    const id = await db.storeNote(exampleNote)
    const theNote = await db.getNote(id, normalOptions)
    expect(theNote).toEqual(exampleNote)

    // Read four times
    await db.getNote(id, multiRead)
    await db.getNote(id, multiRead)
    await db.getNote(id, multiRead)
    await db.getNote(id, multiRead)

    done()
})
