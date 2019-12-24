import React from 'react'
import _ from 'lodash'

const necessaryElements = [
    'crypto.getRandomValues',
    'crypto.subtle.digest',
    'crypto.subtle.generateKey',
    'crypto.subtle.exportKey',
    'crypto.subtle.importKey',
    'crypto.subtle.encrypt',
    'crypto.subtle.decrypt',
]

export const Availability = ({ children }: any) => {
    const missing = necessaryElements.filter(x => !_.get(window, x))
    if (missing.length) {
        return (
            <>
                <p>
                    Your browser does not seem to support all necessary
                    functions
                </p>
                <p>Please use the latest version of Firefox or Chrome</p>
                <p>The following browser features are missing:</p>
                <ul>
                    {missing.map(x => (
                        <li key={x}>{x}</li>
                    ))}
                </ul>
            </>
        )
    }
    return <>{children}</>
}
