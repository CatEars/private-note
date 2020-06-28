import 'jest'
import * as _ from 'lodash'
import uuid from 'uuid'

import { InMemoryDatabase } from '../src/database'
import { exampleNote, exampleLog, normalOptions } from './util'

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
