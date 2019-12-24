import 'jest'
import * as _ from 'lodash'
import uuid from 'uuid'

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

const exampleLog: Log = {
    accessUrl: `http://localhost:3000/${uuid.v4()}`,
    ip: '127.0.0.1',
    timeOfAccess: Date.now(),
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

test('Throws error on old messages', async done => {
    const db = new InMemoryDatabase()
    const theOriginalNote = _.assign({}, exampleNote, {
        burnDate: Date.now() - 1,
    })
    const id = await db.storeNote(theOriginalNote)
    try {
        await db.getNote(id, normalOptions)
        fail()
    } catch (err) {}
    done()
})

test('Throws error on messages that do not exist', async done => {
    const NUMBER_OF_NOTES = 10

    const db = new InMemoryDatabase()

    try {
        // Should fail if it finds one and there are 0 notes in DB
        await db.getNote(uuid.v4(), normalOptions)
        fail()
    } catch (err) {}

    for (let idx = 0; idx < NUMBER_OF_NOTES; ++idx) {
        const noteCopy = _.assign({}, exampleNote)
        await db.storeNote(noteCopy)
    }

    try {
        // Should fail if it finds one and there are 10 notes in DB
        // note: uuids will never clash in practice
        await db.getNote(uuid.v4(), normalOptions)
        fail()
    } catch (err) {}

    done()
})

test('checkBurnDate:false can read old messages', async done => {
    const db = new InMemoryDatabase()
    const theOriginalNote = _.assign({}, exampleNote, {
        burnDate: Date.now() - 1,
    })
    const oldRead = _.assign({}, normalOptions, { checkBurnDate: false })
    const id = await db.storeNote(theOriginalNote)
    const theNote = await db.getNote(id, oldRead)
    expect(theNote).toEqual(theOriginalNote)
    done()
})

test('CheckAllowedReads:false allows one to read multiple times', async done => {
    const multiRead = _.assign({}, normalOptions, { checkAllowedReads: false })

    const db = new InMemoryDatabase()
    const id = await db.storeNote(exampleNote)
    const theNote = await db.getNote(id, normalOptions)
    expect(theNote).toEqual(exampleNote)

    await db.getNote(id, multiRead)
    await db.getNote(id, multiRead)
    await db.getNote(id, multiRead)
    await db.getNote(id, multiRead)

    try {
        await db.getNote(id, normalOptions)
        fail()
    } catch (err) {}

    done()
})

test('Can store logs', async done => {
    const db = new InMemoryDatabase()
    const id = await db.storeLog(exampleLog)
    const theLog = await db.getLog(id)
    expect(theLog).toEqual(exampleLog)
    done()
})

test('Throws error when log already exists', async done => {
    const NUM_LOGS_STORED = 10
    const db = new InMemoryDatabase()

    try {
        // Having 0 log entries should fail to retrieve the item
        await db.getLog(uuid.v4())
        fail()
    } catch (err) {}

    for (let idx = 0; idx < NUM_LOGS_STORED; ++idx) {
        // Having 10 log entries should also fail to retrieve a random item
        const logCopy = _.assign({}, exampleLog)
        await db.storeLog(logCopy)
    }

    try {
        await db.getLog(uuid.v4())
        fail()
    } catch (err) {}

    done()
})

test('InMemoryDatabase can dump its database', async done => {
    const db = new InMemoryDatabase()
    expect(db.dumpDatabase()).toEqual({
        notes: {},
        accesses: {},
        logs: {},
    })

    await db.storeNote(exampleNote)
    expect(db.dumpDatabase()).not.toEqual({
        notes: {},
        accesses: {},
        logs: {},
    })
    done()
})

test('Can store note with default options', async done => {
    const db = new InMemoryDatabase()
    const id = await db.storeNote(exampleNote)
    const theNote = await db.getNote(id, {})
    expect(theNote).toEqual(exampleNote)
    done()
})
