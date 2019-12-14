import React, { useState } from 'react'
import './App.css'
import { ErrorBoundary } from './Error.jsx'
import { NoteFailed } from './NoteFailed.jsx'
import { Note } from './Note.jsx'
import { LinkLoading } from './LinkLoading.jsx'
import { Link } from './Link.jsx'
import { Form } from './Form.jsx'

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

const createNote = async (message: string, burnDate: number) => {
    if (mock) {
        return '744fa5c0-5511-420d-abd3-eaedf7e29e2a'
    } else {
        const response = await apiPost('/api/note', {
            message,
            burnDate,
        })
        const { ID } = await response.json()
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
        const response = await apiGet(`/api/note/${id}`)
        if (!response.ok) {
            throw new Error(`Getting ${id} did not work!`)
        }
        return await response.json()
    }
}

const App = () => {
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
        setCreatedNoteId('1234')
        createNote(message, burnDate).then(id => {
            setCreatedNoteId(id)
        })
    }

    const doLoadNote = (noteId: string) => {
        setNoteLoading(true)
        getNote(noteId)
            .then(note => {
                setNote(note)
            })
            .catch(() => {
                setNoteFailed(true)
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
