import React, { useState } from 'react'
import copyToClipboard from './copyToClipboard'

const withinLastFourSeconds = date => {
    return Date.now() - date < 4000
}

export const Link = props => {
    const { noteId, noteKey } = props

    const [lastCopy, setCopied] = useState(0)

    const url = new URL(window.location.href)
    const linkUrl = `${url.origin}/note/${noteId}#${noteKey}`

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
            <p className="sm:my-3 lg:my-10 text-xl">
                Here is the link to your message
            </p>
            <div className="bg-white mx-5 my-2 lg:w-1/2 lg:mx-auto">
                <i>
                    <h1 className="text-m my-5 mx-5 break-all link-linkText">
                        {linkUrl}
                    </h1>
                </i>
            </div>
            <button
                className="bg-white rounded border shadow py-3 px-5 my-3"
                onClick={onCopyClick}
            >
                Copy
            </button>
        </div>
    )
}
