import React, { useState } from 'react'
import classNames from 'classnames'

export const Form = props => {
    const { onCreateNote } = props
    const [timeUntilRemoved, setTimeUntilRemoved] = useState(60)
    const [messageText, setMessageText] = useState('')
    const [multiplier, setMultiplier] = useState(1000)
    const [selectedConversion, setConversion] = useState('seconds')

    const onMessageChange = event => {
        setMessageText(event.target.value)
    }

    const onTimeChange = event => {
        const nextValue = Number.parseInt(event.target.value)
        if (!isNaN(nextValue) && nextValue > 0)
            setTimeUntilRemoved(event.target.value)
        if (event.target.value === '') {
            setTimeUntilRemoved(-1)
        }
    }

    const onClickSubmit = event => {
        event.preventDefault()
        const message = messageText
        const burnDate = Date.now() + timeUntilRemoved * multiplier
        onCreateNote(message, burnDate)
        return false
    }

    const onSecondSelect = event => {
        event.preventDefault()
        setMultiplier(1000)
        setConversion('seconds')
    }

    const onHourSelect = event => {
        event.preventDefault()
        setMultiplier(60 * 60 * 1000)
        setConversion('hours')
    }

    const onDaySelect = event => {
        event.preventDefault()
        setMultiplier(24 * 60 * 60 * 1000)
        setConversion('days')
    }

    const secondsSelected = selectedConversion === 'seconds'
    const hoursSelected = selectedConversion === 'hours'
    const daysSelected = selectedConversion === 'days'

    const secondsClasses = classNames(
        'mx-auto flex-grow rounded outline-none',
        {
            'shadow-inline bg-gray-400': secondsSelected,
            'shadow bg-white': !secondsSelected,
        }
    )

    const hoursClasses = classNames(
        'mx-auto flex-grow rounded outline-none ml-5 px-2 py-3',
        {
            'shadow-inline bg-gray-400': hoursSelected,
            'shadow bg-white': !hoursSelected,
        }
    )

    const daysClasses = classNames(
        'mx-auto flex-grow rounded outline-none ml-5 px-2 py-3',
        {
            'shadow-inline bg-gray-400': daysSelected,
            'shadow bg-white': !daysSelected,
        }
    )

    return (
        <div className="mx-auto my-4 flex flex-col w-2/3">
            <p className="secretForm-message">
                Enter your secret and get a "use only once" link!
            </p>
            <form className="flex flex-col my-4">
                <textarea
                    id="message"
                    className="my-2 h-30 resize-none border rounded px-1 shadow"
                    value={messageText}
                    placeholder={'Enter message here...'}
                    onChange={onMessageChange}
                />

                <div
                    className="container flex flex-row mx-auto my-5"
                    onClick={() => ''}
                >
                    <button className={secondsClasses} onClick={onSecondSelect}>
                        Seconds
                    </button>

                    <button className={hoursClasses} onClick={onHourSelect}>
                        Hours
                    </button>

                    <button className={daysClasses} onClick={onDaySelect}>
                        Days
                    </button>
                </div>

                <label className="my-2" htmlFor="removalTime">
                    Time until removed ({selectedConversion})
                </label>

                <input
                    type="text"
                    id="removalTime"
                    className="my-2 border rounded px-1 w-1/2 mx-auto shadow"
                    value={timeUntilRemoved > 0 ? timeUntilRemoved : ''}
                    onChange={onTimeChange}
                />

                <input
                    type="submit"
                    value="Submit"
                    className="mx-auto w-1/2 rounded shadow"
                    onClick={onClickSubmit}
                />
            </form>
        </div>
    )
}
