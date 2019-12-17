import React, { useState } from 'react'
import './App.css'
import { ErrorBoundary } from './Error.jsx'
import { NoteFailed } from './NoteFailed.jsx'
import { Note } from './Note.jsx'
import { LinkLoading } from './LinkLoading.jsx'
import { Link } from './Link.jsx'
import { Form } from './Form.jsx'
import {
    encryptMessage,
    decryptMessage,
    urlencodeKey,
    urldecodeKey,
    generateKey,
} from './secrets'

const mock = false

const apiPost = (path: string, body: any) => {
    const url = `${window.location.origin}${path}`
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })
}

const apiGet = (path: string) => {
    const url = `${window.location.origin}${path}`
    return fetch(url, {
        method: 'GET',
    })
}

const createNote = async (
    message: string,
    key: CryptoKey,
    burnDate: number
) => {
    if (mock) {
        return '744fa5c0-5511-420d-abd3-eaedf7e29e2a'
    } else {
        const { encryptedMessage, IV, fingerprint } = await encryptMessage(
            message,
            key
        )
        const note = {
            allowedReads: 1,
            encryptedMessage: Array.prototype.slice.call(
                new Uint8Array(encryptedMessage)
            ),
            fingerprint: Array.prototype.slice.call(
                new Uint8Array(fingerprint)
            ),
            IV: Array.prototype.slice.call(IV),
            burnDate,
        }
        console.log('NOTE')
        console.log(note)
        console.log('Creating note')
        const response = await apiPost('/api/note', note)
        console.log('repsponse!')
        const { ID } = await response.json()
        console.log('ID=' + ID)
        return ID
    }
}

const getNote = async (id: string) => {
    if (mock) {
        return {
            message: 'Test message',
            burnDate: Date.now() + 10000,
        }
    } else {
        console.log('ID:' + id)
        const response = await apiGet(`/api/note/${id}`)
        if (!response.ok) {
            throw new Error(`Getting ${id} did not work!`)
        }
        console.log('response:')
        console.log(response)
        const note = await response.json()
        console.log('note')
        console.log(note)
        note.encryptedMessage = new Uint8Array(note.encryptedMessage).buffer
        note.fingerprint = new Uint8Array(note.fingerprint).buffer
        note.IV = new Uint8Array(note.IV)
        console.log('NOTE')
        console.log(note)
        console.log('HASH:', window.location.hash.substr(1))
        const key = await urldecodeKey(window.location.hash.substr(1))
        console.log('KEY:', key)
        const decryptedMessage = await decryptMessage(key, note)
        return {
            message: decryptedMessage,
            burnDate: note.burnDate,
        }
    }
}

const App = () => {
    const currentLocation = window.location.href
    const url = new URL(currentLocation)
    const [createdNoteId, setCreatedNoteId] = useState('')
    const [createdNoteKey, setCreatedNoteKey] = useState('')
    const [noteLoading, setNoteLoading] = useState(false)
    const [note, setNote] = useState({
        message: 'hello world',
        burnDate: Date.now() + 5000,
    })
    const [noteFailed, setNoteFailed] = useState(false)

    const onKeyGenerated = (key: CryptoKey) => {
        urlencodeKey(key)
            .then(encodedString => {
                console.log('encodedString:', encodedString)
                setCreatedNoteKey(encodedString)
            })
            .catch(console.error)
    }

    const onCreateNote = (message: string, burnDate: number) => {
        setCreatedNoteId('1234')
        generateKey()
            .then(key => {
                console.log('KEU', key)
                onKeyGenerated(key)
                return createNote(message, key, burnDate)
            })
            .then(id => {
                setCreatedNoteId(id)
            })
            .catch(console.error)
    }

    const doLoadNote = (noteId: string) => {
        setNoteLoading(true)
        getNote(noteId)
            .then(note => {
                setNote(note)
            })
            .catch(err => {
                setNoteFailed(true)
                console.error(err)
            })
    }

    let app = <p>...</p>

    const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12})/g
    const urlIncludesUuid = uuidRegex.test(url.pathname)
    const creatingNoteId = createdNoteId === '1234'
    const showLink = createdNoteId && !creatingNoteId && createdNoteKey !== ''

    if (noteFailed) {
        app = <NoteFailed />
    } else if (urlIncludesUuid) {
        const matches = url.pathname.match(uuidRegex) as any
        if (!noteLoading) {
            doLoadNote(matches[0])
        }
        app = <Note noteId={matches[0]} note={note} />
    } else if (creatingNoteId) {
        app = <LinkLoading />
    } else if (showLink) {
        console.log('CREATED NOTE KEY IS:', createdNoteKey)
        app = <Link noteId={createdNoteId} noteKey={createdNoteKey} />
    } else {
        app = <Form onCreateNote={onCreateNote} />
    }

    return (
        <ErrorBoundary>
            <div className="flex flex-col bg-indigo-200 h-full w-full text-center content-center mx-auto">
                {app}
            </div>
        </ErrorBoundary>
    )
}

export default App
