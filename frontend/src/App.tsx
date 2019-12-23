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
    getEncryptionScheme,
} from './secrets'

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
    const { encryptedMessage, IV, fingerprint } = await encryptMessage(
        message,
        key
    )
    const note = {
        allowedReads: 1,
        encryptedMessage: Array.prototype.slice.call(
            new Uint8Array(encryptedMessage)
        ),
        fingerprint: Array.prototype.slice.call(new Uint8Array(fingerprint)),
        IV: Array.prototype.slice.call(IV),
        burnDate,
        encryptionScheme: getEncryptionScheme(),
    }
    console.log('POSTing note to API')
    const response = await apiPost('/api/note', note)
    const { ID } = await response.json()
    return ID
}

const getNote = async (id: string) => {
    const response = await apiGet(`/api/note/${id}`)
    if (!response.ok) {
        throw new Error(`Getting ${id} did not work!`)
    }
    const note = await response.json()

    note.encryptedMessage = new Uint8Array(note.encryptedMessage).buffer
    note.fingerprint = new Uint8Array(note.fingerprint).buffer
    note.IV = new Uint8Array(note.IV)

    const urlencodedKey = window.location.hash.substr(1)
    const key = await urldecodeKey(urlencodedKey)
    const decryptedMessage = await decryptMessage(key, note)

    return {
        message: decryptedMessage,
        burnDate: note.burnDate,
    }
}

const App = () => {
    const currentLocation = window.location.href
    const url = new URL(currentLocation)
    const [createdNoteId, setCreatedNoteId] = useState('')
    const [createdNoteKey, setCreatedNoteKey] = useState('')
    const [noteLoading, setNoteLoading] = useState(false)
    const [note, setNote] = useState({
        message: '',
        burnDate: Date.now() + 5000,
    })
    const [noteFailed, setNoteFailed] = useState(false)

    const onKeyGenerated = (key: CryptoKey) => {
        console.log('Key has been generated')
        urlencodeKey(key)
            .then(encodedString => {
                console.log(
                    'Encoded key length is:',
                    (encodedString || '').length
                )
                setCreatedNoteKey(encodedString)
            })
            .catch(console.error)
    }

    const onCreateNote = (message: string, burnDate: number) => {
        setCreatedNoteId('1234')
        generateKey()
            .then(key => {
                onKeyGenerated(key)
                return createNote(message, key, burnDate)
            })
            .then(id => {
                console.log('Note generated with ID', id)
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
