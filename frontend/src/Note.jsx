import React, { useState } from 'react'
import copyToClipboard from './copyToClipboard'

const withinLastFourSeconds = date => {
    return Date.now() - date < 4000
}

export const Note = props => {
    const { noteId, note } = props
    const [lastCopy, setCopied] = useState(0)

    const onCopyClick = event => {
        event.preventDefault()
        setCopied(Date.now())
        setTimeout(() => {
            setCopied(lastCopy)
        }, 4500)
        copyToClipboard(note.message)
        return false
    }

    let copied = <div></div>

    if (withinLastFourSeconds(lastCopy)) {
        copied = (
            <div className="bg-blue-500 text-white text-sm font-bold px-4 py-3">
                <p>Copied to clipboard!</p>
            </div>
        )
    }

    return (
        <div>
            {copied}
            <div className="flex flex-col content-center text-center mx-auto w-1/2 my-3">
                <h2 className="">
                    You are viewing note:{' '}
                    <span className="font-bold">{noteId}</span>
                </h2>
                <p className="resize-none my-5 my-2 py-2 text-left px-3 content-start border rounded-b shadow bg-white">
                    {note.message}
                </p>
                <button
                    className="bg-white rounded border shadow py-3 px-5 my-3 w-1/5 mx-auto"
                    onClick={onCopyClick}
                >
                    Copy
                </button>
                <p className="my-3 text-xl">
                    <span className="font-bold">Note</span>: Make sure to
                    <span className="font-bold"> save</span> the note
                    <span className="font-bold"> now</span>. It will
                    <span className="font-bold"> not</span> be accesible if you
                    reload or open the link again.
                </p>
            </div>
        </div>
    )
}
