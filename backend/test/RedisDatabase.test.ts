import 'jest'
jest.mock('../src/logger')

import { RedisDatabase } from '../src/database/RedisDatabase'
import uuid from 'uuid'

describe('RedisDatabase', () => {
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

    it('Can connect and disconnect', async done => {
        const db: any = new RedisDatabase()
        await db.startDatabase()
        await db.stopDatabase()
        expect(db.redis.calls.length).toBe(2)
        expect(db.redis.calls[0]).toStrictEqual(['connect'])
        expect(db.redis.calls[1]).toStrictEqual(['quit'])
        done()
    })
})
