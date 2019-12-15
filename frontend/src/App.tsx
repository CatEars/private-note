import React, { useState } from 'react'
import './App.css'
import { ErrorBoundary } from './Error.jsx'
import { NoteFailed } from './NoteFailed.jsx'
import { Note } from './Note.jsx'
import { LinkLoading } from './LinkLoading.jsx'
import { Link } from './Link.jsx'
import { Form } from './Form.jsx'
import { encryptMessage, decryptMessage } from './secrets'

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
    password: string,
    burnDate: number
) => {
    if (mock) {
        return '744fa5c0-5511-420d-abd3-eaedf7e29e2a'
    } else {
        const {
            encryptedMessage,
            IV,
            salt,
            fingerprint,
        } = await encryptMessage(message, password)
        const note = {
            allowedReads: 1,
            encryptedMessage: Array.prototype.slice.call(
                new Uint32Array(encryptedMessage)
            ),
            fingerprint: Array.prototype.slice.call(
                new Uint32Array(fingerprint)
            ),
            IV: Array.prototype.slice.call(IV),
            salt: Array.prototype.slice.call(salt),
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
        note.encryptedMessage = new Uint32Array(note.encryptedMessage).buffer
        note.fingerprint = new Uint32Array(note.fingerprint).buffer
        note.IV = new Uint32Array(note.IV)
        note.salt = new Uint32Array(note.salt)
        console.log('NOTE')
        console.log(note)
        const password = 'password123'
        const decryptedMessage = await decryptMessage(password, note)
        return {
            message: decryptedMessage,
            burnDate: note.burnDate,
        }
    }
}

const App = () => {
    encryptMessage('Hello, World!', 'password123')
        .then(msg => {
            return decryptMessage('password123', msg)
        })
        .then(decryptication => {
            console.log('Decrypted message:', decryptication)
        })
    const currentLocation = window.location.href
    const url = new URL(currentLocation)
    const [createdNoteId, setCreatedNoteId] = useState('')
    const [noteLoading, setNoteLoading] = useState(false)
    const [note, setNote] = useState({
        message: 'hello world',
        burnDate: Date.now() + 5000,
    })
    const [noteFailed, setNoteFailed] = useState(false)

    const onCreateNote = (message: string, burnDate: number) => {
        const password = 'password123'
        setCreatedNoteId('1234')
        console.log('Time to create note????')
        createNote(message, password, burnDate)
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
    const showLink = createdNoteId && !creatingNoteId

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
        app = <Link noteId={createdNoteId} />
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
