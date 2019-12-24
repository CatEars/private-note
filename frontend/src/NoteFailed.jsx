import React from 'react'

export const NoteFailed = ({ message }) => (
    <div className="content-center text-center">
        <p className="text-xl lg:w-1/5 sm:w-1/2 my-3 mx-auto px-2 py-2">
            {message}
        </p>
    </div>
)
