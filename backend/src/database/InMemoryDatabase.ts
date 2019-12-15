import uuid from 'uuid'

import { Database, Log, LogId, Note, NoteId, NoteOptions } from './types'

/**
 * Database that stores notes in working memory.
 */
export class InMemoryDatabase implements Database {
    private storage = {
        notes: {},
        accesses: {},
        logs: {},
    }

    InMemoryDatabase() {}

    async startDatabase() {
        return
    }

    async stopDatabase() {
        return
    }

    async storeNote(note: Note) {
        const id = uuid.v4() as NoteId
        this.storage.notes[id] = note
        this.storage.accesses[id] = []
        return id
    }

    async storeLog(entry: Log) {
        const id = uuid.v4() as LogId
        this.storage.logs[id] = entry
        return id
    }

    async getNote(noteId: NoteId, options: NoteOptions) {
        const {
            checkAllowedReads = true,
            checkBurnDate = true,
            addAccess = true,
            accessInfo = {},
        } = options

        if (!this.storage.notes[noteId]) {
            throw new Error(`Note with Id "${noteId}" did not exist.`)
        }

        const note = this.storage.notes[noteId]
        const currentAccesses = this.storage.accesses[noteId]
        if (checkAllowedReads && currentAccesses.length >= note.allowedReads) {
            const A = note.allowedReads
            const B = currentAccesses.length
            throw new Error(
                `Note with Id "${noteId}" allows only ${A} reads but ` +
                    `currently has ${B} reads`
            )
        }

        const currentTime = Date.now()
        if (checkBurnDate && note.burnDate >= currentTime) {
            const A = new Date(note.burnDate)
            const B = new Date(currentTime)
            throw new Error(
                `Note with id "${noteId}" allows only access before ${A} ` +
                    `but currently it is ${B}`
            )
        }

        if (addAccess) {
            this.storage.accesses[noteId].push(accessInfo)
        }

        return note
    }

    async getLog(logId: LogId) {
        if (!this.storage.logs[logId]) {
            throw new Error(`Log with Id "${logId}" did not exist.`)
        }

        return this.storage.logs[logId]
    }

    dumpDatabase(): any {
        return this.storage
    }
}
