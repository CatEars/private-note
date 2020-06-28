import 'jest'
import { Database } from '../src/database/types'
import { RedisDatabase } from '../src/database/RedisDatabase'
import { InMemoryDatabase } from '../src/database/InMemoryDatabase'
import uuid from 'uuid'
import each from 'jest-each'
import _ from 'lodash'
import {
    exampleNote,
    normalOptions,
    exampleLog,
    NewNote,
    uuidv4Regex,
} from './util'

each([
    // First argument is the name solely for the purpose of a nice describe() name
    ['InMemoryDatabase', InMemoryDatabase],
    ['RedisDatabase', RedisDatabase],
]).describe('Database Interface Test For: %s', (name, DatabaseClass) => {
    it('Can be created', () => {
        new DatabaseClass()
    })

    it('Can start database without any options', async done => {
        const db = new DatabaseClass()
        await db.startDatabase()
        done()
    })

    it('Can store and retrieve logs', async done => {
        const db = new DatabaseClass()
        const id = await db.storeLog(exampleLog)
        expect(id).toMatch(uuidv4Regex)
        const log = await db.getLog(id)
        expect(log).toEqual(exampleLog)
        done()
    })

    it('Can store and retrieve a note', async done => {
        const db = new DatabaseClass()
        const id = await db.storeNote(exampleNote)
        expect(id).toMatch(uuidv4Regex)
        const note = await db.getNote(id, {})
        expect(note).toEqual(exampleNote)
        done()
    })

    it('Can check if a note exists', async done => {
        const db = new DatabaseClass()
        expect(await db.noteExists(uuid.v4())).toBeFalsy()
        expect(await db.noteExists(uuid.v4())).toBeFalsy()
        expect(await db.noteExists(uuid.v4())).toBeFalsy()
        const id = await db.storeNote(exampleNote)
        expect(await db.noteExists(id)).toBeTruthy()
        expect(await db.noteExists(uuid.v4())).toBeFalsy()
        expect(await db.noteExists(id)).toBeTruthy()
        done()
    })

    it('Can check that a note has burned', async done => {
        const db = new DatabaseClass()
        const burnedNote = _.assign({}, exampleNote, {
            burnDate: Date.now() - 1,
        })
        const burnedId = await db.storeNote(burnedNote)
        const id = await db.storeNote(exampleNote)

        expect(await db.hasBurned(burnedId)).toEqual(true)
        expect(await db.hasBurned(id)).toEqual(false)
        done()
    })

    it('Checking if a non-existant note has burned fails', async done => {
        const db = new DatabaseClass()
        try {
            await db.hasBurned(uuid.v4())
            fail()
        } catch (error) {
            done()
        }
    })

    it('Can check if a note has already been read', async done => {
        const db = new DatabaseClass()
        const id = await db.storeNote(exampleNote)
        expect(await db.hasBeenRead(id)).toBeFalsy()
        const note = await db.getNote(id, {})
        expect(await db.hasBeenRead(id)).toBeTruthy()
        expect(await db.hasBeenRead(id)).toBeTruthy()
        done()
    })

    it('addAccess: false will not add an access to the note', async done => {
        const multiAccess = _.assign({}, normalOptions, { addAccess: false })

        const db: Database = new DatabaseClass()
        const id = await db.storeNote(exampleNote)

        for (let i = 0; i < 5; ++i) {
            const n = await db.getNote(id, multiAccess)
            expect(n).toEqual(exampleNote)
        }

        const note = await db.getNote(id, normalOptions)
        expect(note).toEqual(exampleNote)

        try {
            await db.getNote(id, normalOptions)
            fail()
        } catch (error) {
            done()
        }
    })

    it('checkBurnDate:false can read old messages', async done => {
        const db = new DatabaseClass()
        const theOriginalNote = _.assign({}, exampleNote, {
            burnDate: Date.now() - 1,
        })
        const oldRead = _.assign({}, normalOptions, { checkBurnDate: false })
        const id = await db.storeNote(theOriginalNote)
        const theNote = await db.getNote(id, oldRead)
        expect(theNote).toEqual(theOriginalNote)
        done()
    })

    it('CheckAllowedReads:false allows one to read multiple times', async done => {
        const multiRead = _.assign({}, normalOptions, {
            checkAllowedReads: false,
        })

        const db = new DatabaseClass()
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

    it('Will throw an error if the note does not exist', async done => {
        const db = new DatabaseClass()
        try {
            await db.getNote(uuid.v4(), {})
            fail()
        } catch (error) {
            done()
        }
    })

    it('Will throw an error if a log does not exist', async done => {
        const db = new DatabaseClass()
        try {
            await db.getLog(uuid.v4())
            fail()
        } catch (error) {
            done()
        }
    })

    it('Will throw an error if checking a non-existant note for being read', async done => {
        const db = new DatabaseClass()
        try {
            await db.hasBeenRead(uuid.v4())
            fail()
        } catch (error) {
            done()
        }
    })

    it('Throws error on retrieve note twice', async done => {
        const db = new DatabaseClass()
        const id = await db.storeNote(exampleNote)
        expect(exampleNote.allowedReads).toEqual(1)
        const theNote = await db.getNote(id, normalOptions)
        expect(theNote).toEqual(exampleNote)
        try {
            await db.getNote(id, normalOptions)
            fail()
        } catch (err) {}
        done()
    })

    it('Throws error on old messages', async done => {
        const db = new DatabaseClass()
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

    it('Can stop the database', async done => {
        const db: Database = new DatabaseClass()
        await db.startDatabase()
        await db.stopDatabase()
        done()
    })
})
