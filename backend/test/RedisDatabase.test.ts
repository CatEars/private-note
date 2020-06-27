import 'jest'
jest.mock('ioredis')

import { Note } from '../src/database/types'
import { RedisDatabase } from '../src/database/RedisDatabase'
import uuid from 'uuid'

const exampleNote: Note = {
    allowedReads: 1,
    encryptedMessage: [1, 2, 3],
    fingerprint: [3, 2, 1],
    IV: [4, 5, 6],
    burnDate: Date.now() + 100000,
}

const NewNote = (burnDate: number): Note => {
    return {
        allowedReads: 1,
        encryptedMessage: [1, 2, 3],
        fingerprint: [3, 2, 1],
        IV: [4, 5, 6],
        burnDate,
    }
}

const uuidv4Regex = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/

describe('RedisDatabase', () => {
    it('Can be created', () => {
        new RedisDatabase()
    })

    it('Can start database without any options', () => {
        const db = new RedisDatabase()
        db.startDatabase()
    })

    it('Sends configuration values direct through to ioredis', () => {
        let db: any = new RedisDatabase()
        expect(db.redis.constructorParams).toBe(undefined)
        const options = {
            port: 6379,
            host: '127.0.0.1',
            family: 4,
            password: 'auth',
            db: 0,
        }
        db = new RedisDatabase(options)
        expect(db.redis.constructorParams).toBe(options)
    })

    it('Can store and retrieve a note', async done => {
        let db: any = new RedisDatabase()
        const id = await db.storeNote(exampleNote)
        expect(id).toMatch(uuidv4Regex)
        const note = await db.getNote(id, {})
        expect(note).toEqual(exampleNote)
        done()
    })

    it('Can check if a note exists', async done => {
        let db: any = new RedisDatabase()
        expect(await db.noteExists(uuid.v4())).toBeFalsy()
        const id = await db.storeNote()
        expect(await db.noteExists(id)).toBeTruthy()
        expect(await db.noteExists(uuid.v4())).toBeFalsy()
        expect(await db.noteExists(id)).toBeTruthy()
        expect(await db.noteExists(id)).toBeTruthy()
        expect(await db.noteExists(id)).toBeTruthy()
        done()
    })

    it('Can check if a note has burned', async done => {
        let db: any = new RedisDatabase()
        let id = await db.storeNote(NewNote(Date.now() - 1))
        expect(await db.hasBurned(id)).toBeTruthy()
        id = await db.storeNote(NewNote(Date.now() + 1000))
        expect(await db.hasBurned(id)).toBeFalsy()
        done()
    })

    it('Checking if a non-existant note has burned fails', async done => {
        const db: any = new RedisDatabase()
        try {
            await db.hasBurned(uuid.v4())
            fail()
        } catch (error) {
            done()
        }
    })

    it('Can check if a note has already been read', () => {
        fail()
    })

    it('Allows to specify checkAllowedRead: false to still allow reading', () => {
        fail()
    })

    it('Can disconnect on stopping', () => {
        const db: any = new RedisDatabase()
        db.stopDatabase()
        expect(db.redis.calls.length).toBe(1)
        expect(db.redis.calls[0]).toStrictEqual(['disconnect'])
    })
})
