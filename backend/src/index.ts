import express from 'express'
import expressPino from 'express-pino-logger'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import fs from 'fs'
import expressNobots from './thirdparty/express-nobots'

import * as database from './database'
import {
    Config,
    initConfigurationWatch,
    stopConfigurationWatch,
} from './config'
import { logger } from './logger'

const JSON_MAX_SIZE = process.env.JSON_MAX_SIZE || '1mb'
const LIMIT_WINDOW_MS = Number.parseInt(
    process.env.LIMIT_WINDOW_MS || `${15 * 60 * 8 * 1000}`
)
const MAX_REQUEST_RATE_LIMIT = Number.parseInt(
    process.env.MAX_REQUEST_RATE_LIMIT || '100'
)

const LIMITER = rateLimit({
    windowMs: LIMIT_WINDOW_MS,
    max: MAX_REQUEST_RATE_LIMIT,
})

let db

const loadDbFromConfig = () => {
    const databaseType = Config.databaseType()
    const databaseConfig = Config.databaseConfig()

    if (databaseType === 'in-memory-database') {
        logger.info(`Loading InMemoryDatabse as database`)
        return new database.InMemoryDatabase()
    } else if (fs.existsSync(databaseType)) {
        logger.info(`Loading database from file: ${databaseType}`)
        try {
            const loaded = require(databaseType) as any
            const { createDatabase } = loaded
            const db = createDatabase(databaseConfig)
            const missingFunctions = database.unimplementedFunctionsOfDatabase(
                db
            )
            if (missingFunctions.length) {
                logger.warn(
                    `Database is missing the following functions: ` +
                        `${missingFunctions}. Continuing anyway.`
                )
            }
            return db
        } catch (err) {
            logger.error(
                `Could not load database from file: ${databaseType}.`,
                err
            )
        }
    } else {
        throw new Error(`Database "${databaseType}" is not found or recognized`)
    }
}

const createLog = async (req: express.Request) => {
    const log: database.Log = {
        accessUrl: req.url,
        ip: req.ip,
        timeOfAccess: Date.now(),
    }
    return await db.storeLog(log)
}

const isUuidV4 = (id: any) => {
    if (!id) {
        return false
    }
    return /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i.test(
        id
    )
}

const isArray = (val: any) => {
    return val && val.length !== undefined
}

const validateNote = (note: any) => {
    return (
        Number.isInteger(note.allowedReads) &&
        note.allowedReads > 0 &&
        Number.isInteger(note.burnDate) &&
        note.burnDate > Date.now() &&
        isArray(note.encryptedMessage) &&
        isArray(note.fingerprint) &&
        isArray(note.IV)
    )
}

const main = async () => {
    initConfigurationWatch()

    db = loadDbFromConfig()
    await db.startDatabase()

    const app = express()
    app.use(
        express.json({
            limit: JSON_MAX_SIZE,
        })
    )
    app.use('/api', LIMITER)
    app.use(helmet())
    app.use(express.static('static'))

    if (Config.enableExpressLogging()) {
        app.use(expressPino({ logger }))
    }

    app.get(
        '/api/note/:ID/status',
        async (req: express.Request, res: express.Response) => {
            try {
                const { ID } = req.params
                if (!isUuidV4(ID)) {
                    logger.error(`ID "${ID}" is not a valid UUIDv4`)
                    res.sendStatus(400)
                    return
                }

                const exists = await db.noteExists(ID)
                if (!exists) {
                    logger.error(
                        `Tried to get status of Note ${ID} but no such note exists`
                    )
                    res.sendStatus(404)
                    return
                }
                const hasBurned = await db.hasBurned(ID)
                const hasBeenRead = await db.hasBeenRead(ID)

                logger.info(`Returning status of note with ID ${ID}`)
                res.json({
                    hasBeenRead,
                    hasBurned,
                })
            } catch (err) {
                logger.error({
                    message: `GET /api/note/:ID/status Got error when loading status of note`,
                    error: err,
                })
                res.sendStatus(500)
            }
        }
    )

    app.get(
        '/api/note/:ID',
        async (req: express.Request, res: express.Response) => {
            try {
                const { ID } = req.params
                if (!isUuidV4(ID)) {
                    logger.error(`ID "${ID}" is not a valid UUIDv4`)
                    res.sendStatus(400)
                    return
                }

                const logId = await createLog(req)
                const exists = await db.noteExists(ID)
                if (!exists) {
                    logger.error(
                        `Tried to access Note ${ID} but no such note exists`
                    )
                    res.sendStatus(404)
                    return
                }

                const options: database.NoteOptions = {
                    accessInfo: {
                        logId,
                    },
                    addAccess: true,
                    checkAllowedReads: true,
                    checkBurnDate: true,
                }
                const note = await db.getNote(ID, options)

                logger.info(`Retrieved note "${ID}" and sending it back`)
                res.json(note)
            } catch (error) {
                logger.error('GET /api/note/:ID', error)
                res.sendStatus(500)
            }
        }
    )

    app.post(
        '/api/note',
        async (req: express.Request, res: express.Response) => {
            try {
                const {
                    allowedReads,
                    encryptedMessage,
                    fingerprint,
                    IV,
                    burnDate,
                    encryptionScheme,
                } = req.body
                const note: database.Note = {
                    allowedReads,
                    encryptedMessage,
                    fingerprint,
                    IV,
                    burnDate,
                    encryptionScheme,
                }

                if (!validateNote(note)) {
                    logger.error({
                        message: `NOTE: ${note} was not a valid note!`,
                        note,
                    })
                    res.sendStatus(400)
                    return
                }

                await createLog(req)
                const ID = await db.storeNote(note)
                logger.info(`Created note: ${ID}`)
                res.json({ ID })
            } catch (error) {
                logger.error('POST /api/note', error)
                res.sendStatus(500)
            }
        }
    )

    app.use('/note/*', expressNobots())
    app.get('/note/*', (req: express.Request, res: express.Response) => {
        try {
            const options = {
                root: process.cwd(),
            }
            logger.debug('Request for: ' + req.path)
            res.sendFile('./static/index.html', options)
        } catch (err) {
            logger.error(
                'User tried to get note at ' +
                    req.path +
                    ' but got error ' +
                    err
            )
            res.sendStatus(500)
        }
    })

    app.get('/', (req: express.Request, res: express.Response) => {
        try {
            const options = {
                root: process.cwd(),
            }
            res.sendFile('./static/index.html', options)
        } catch (err) {
            logger.error(
                'User tried to get note at ' +
                    req.path +
                    ' but got error ' +
                    err
            )
            res.sendStatus(500)
        }
    })

    app.listen(3000, () => {
        logger.info('Listening on port 3000')
    })
}

if (require.main === module) {
    process.on('SIGINT', async () => {
        logger.info('Caught interrupt signal')
        stopConfigurationWatch()
        await db.stopDatabase()
        process.exit()
    })

    main()
}
