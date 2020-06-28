import 'jest'

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

    it('Can disconnect on stopping', async done => {
        const db: any = new RedisDatabase()
        await db.stopDatabase()
        expect(db.redis.calls.length).toBe(1)
        expect(db.redis.calls[0]).toStrictEqual(['disconnect'])
        done()
    })
})
