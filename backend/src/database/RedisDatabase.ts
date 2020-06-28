import uuid from 'uuid'
import Redis, { RedisOptions } from 'ioredis'
import { logger } from '../logger'

import { NoteId, LogId, Note, NoteOptions, Log, Database } from './types'
import _ from 'lodash'

/**
 * Database implementation with Redis as backend.
 *
 * Uses [ioredis](https://www.npmjs.com/package/ioredis) as client library.
 *
 * Call `configureRedis(...)` with the same options that you would to ioredis.
 * If calling with no arguments, then just do not call configureRedis.
 * `startDatabase()` will fix that for you.
 */
export class RedisDatabase implements Database {
    private redis: Redis.Redis

    constructor(options?: RedisOptions) {
        this.redis = new Redis(options)
    }

    async startDatabase() {
        if (!_.includes(['connecting', 'connected'], this.redis.status)) {
            logger.info(`Connecting to redis`)
            await this.redis.connect()
        }
    }

    async storeNote(note: Note) {
        const id = uuid.v4() as NoteId
        const jsonified = JSON.stringify(note)
        logger.debug(`Storing note ${id} in Redis under note-${id}`)
        await this.redis.set(`note-${id}`, jsonified)
        await this.redis.set(`read-${id}`, '[]')
        return id
    }

    async storeLog(entry: Log) {
        const id = uuid.v4() as LogId
        const jsonified = JSON.stringify(entry)
        logger.debug(`Storing log ${id} in Redis under log-${id}`)
        await this.redis.set(`log-${id}`, jsonified)
        return id
    }

    async getNote(noteId: NoteId, options: NoteOptions) {
        const {
            checkAllowedReads = true,
            checkBurnDate = true,
            addAccess = true,
            accessInfo = {},
        } = options

        const doesExist = await this.redis.exists(`note-${noteId}`)
        if (!doesExist) {
            throw new Error(`Note with Id "${noteId}" does not exist.`)
        }

        const note = JSON.parse((await this.redis.get(`note-${noteId}`)) || '')
        const currentReads = JSON.parse(
            (await this.redis.get(`read-${noteId}`)) || ''
        )
        if (checkAllowedReads && currentReads.length >= note.allowedReads) {
            const A = note.allowedReads
            const B = currentReads.length
            throw new Error(
                `Note with Id "${noteId}" allows only ${A} reads but ` +
                    `currently has ${B} reads`
            )
        }

        const currentTime = Date.now()
        if (checkBurnDate && currentTime >= note.burnDate) {
            const A = new Date(note.burnDate)
            const B = new Date(currentTime)
            throw new Error(
                `Note with id "${noteId}" allows only access before ${A} ` +
                    `but currently it is ${B}`
            )
        }

        if (addAccess) {
            const nextReads = currentReads.concat([accessInfo])
            logger.debug(`Note ${noteId} was read`)
            await this.redis.set(`read-${noteId}`, JSON.stringify(nextReads))
        }

        return note
    }

    async getLog(logId: LogId) {
        const key = `log-${logId}`
        const doesExist = await this.redis.exists(key as string)
        if (!doesExist) {
            throw new Error(`Log with Id "${logId}" does not exist.`)
        }

        const jsonified = (await this.redis.get(key)) || ''
        logger.debug(`Log ${logId} was read`)
        return JSON.parse(jsonified)
    }

    async noteExists(noteId: NoteId) {
        return !!(await this.redis.exists(`note-${noteId}`))
    }

    async hasBurned(noteId: NoteId) {
        const noteExists = await this.redis.exists(`note-${noteId}`)
        if (!noteExists) {
            throw new Error(
                `Note with id "${noteId}" does not exist. Cannot check if burnt.`
            )
        }

        const note = JSON.parse((await this.redis.get(`note-${noteId}`)) || '')
        return note.burnDate < Date.now()
    }

    async hasBeenRead(noteId: NoteId) {
        const noteExists = await this.redis.exists(`note-${noteId}`)
        if (!noteExists) {
            throw new Error(
                `Note with id "${noteId}" does not exist. Cannot check read count.`
            )
        }

        const note = JSON.parse((await this.redis.get(`note-${noteId}`)) || '')
        const reads = JSON.parse((await this.redis.get(`read-${noteId}`)) || '')
        return reads.length >= note.allowedReads
    }

    async stopDatabase() {
        logger.info(`Disconnecting from redis`)
        await this.redis.quit()
    }
}
