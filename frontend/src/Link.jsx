import React, { useState } from 'react'
import copyToClipboard from './copyToClipboard'

const withinLastFourSeconds = date => {
    return Date.now() - date < 4000
}

export const Link = props => {
    const { noteId, noteKey } = props

    const [lastCopy, setCopied] = useState(0)

    const url = new URL(window.location.href)
    const linkUrl = `${url.origin}/${noteId}#${noteKey}`

    const onCopyClick = event => {
        event.preventDefault()
        setCopied(Date.now())
        setTimeout(() => {
            setCopied(lastCopy)
        }, 4500)
        copyToClipboard(linkUrl)
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
        <div className="link">
            {copied}
            <p className="my-3">Here is the link to your message</p>
            <h1 className="text-2xl my-5 mx-10 break-all link-linkText">
                {linkUrl}
            </h1>
            <button
                className="bg-white rounded border shadow py-3 px-5 my-3"
                onClick={onCopyClick}
            >
                Copy
            </button>
        </div>
    )
}
