import express from 'express'
import * as database from './database'

const db = new database.InMemoryDatabase()

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
        isArray(note.IV) &&
        isArray(note.salt)
    )
}

const main = async () => {
    await db.startDatabase()

    const app = express()
    app.use(express.json())
    app.use(express.static('./static'))

    app.get(
        '/api/note/:ID',
        async (req: express.Request, res: express.Response) => {
            try {
                const { ID } = req.params
                if (!isUuidV4(ID)) {
                    res.sendStatus(400)
                    return
                }

                const logId = await createLog(req)
                const options: database.NoteOptions = {
                    accessInfo: {
                        logId,
                    },
                    addAccess: true,
                    checkAllowedReads: true,
                    checkBurnDate: true,
                }
                const note = await db.getNote(ID)

                console.log(`Retrieved note "${ID}" and sending it back`)
                res.send(note)
            } catch (error) {
                console.error('GET /api/note/:ID', error)
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
                    salt,
                    burnDate,
                } = req.body
                const note: database.Note = {
                    allowedReads,
                    encryptedMessage,
                    fingerprint,
                    IV,
                    salt,
                    burnDate,
                }

                if (!validateNote(note)) {
                    res.sendStatus(400)
                    return
                }

                await createLog(req)
                const ID = await db.storeNote(note)
                res.send({ ID })
            } catch (error) {
                console.error('POST /api/note', error)
                res.sendStatus(500)
            }
        }
    )

    app.get('/*', (req: express.Request, res: express.Response) => {
        try {
            res.sendFile(process.cwd() + '/./static/index.html')
        } catch (error) {
            console.error('GET /*', error)
            res.sendStatus(500)
        }
    })

    app.listen(3000)
}

if (require.main === module) {
    process.on('SIGINT', function() {
        console.log('Caught interrupt signal')
        process.exit()
        await db.stopDatabase()
    })

    setInterval(() => {
        const fs = require('fs')
        const database = db.dumpDatabase()
        const stringified = JSON.stringify(database, null, 2)
        fs.writeFileSync('database.json', stringified)
    }, 5000)

    main()
}
