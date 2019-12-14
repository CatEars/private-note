import React, { useState } from 'react';
import './App.css';

const mock = false;

const apiPost = (path: string, body: any) => {
    const url = `${window.location.origin}${path}`;
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
};

const apiGet = (path: string) => {
    const url = `${window.location.origin}${path}`;
    return fetch(url, {
        method: 'GET'
    });
};

const createNote = async (message: string, burnDate: number) => {
    if (mock) {
        return '744fa5c0-5511-420d-abd3-eaedf7e29e2a';
    } else {
        const response = await apiPost('/api/note', {
            message, burnDate
        });
        const { ID } = await response.json();
        return ID;
    }
};

const getNote = async (id: string) => {
    if (mock) {
        return {
            message: 'Test message', burnDate: Date.now() + 10000
        };
    } else {
        const response = await apiGet(`/api/note/${id}`);
        if (!response.ok) {
            throw new Error(`Getting ${id} did not work!`);
        }
        return await response.json();
    }
};

const App: React.FC = () => {
    const currentLocation = window.location.href;
    const url = new URL(currentLocation);
    const [messageText, setMessageText] = useState('Enter message here...');
    const [timeUntilRemoved, setTimeUntilRemoved] = useState(60);
    const [note, setNote] = useState({message: '', burnDate: Date.now()});
    const [noteLoading, setNoteLoading] = useState(false);
    const [createdNoteId, setCreatedNoteId] = useState('');
    const [noteFailed, setNoteFailed] = useState(false);

    const onClickSubmit = (event: any) => {
        event.preventDefault();
        const message = messageText;
        const burnDate = Date.now() + timeUntilRemoved * 1000;
        setCreatedNoteId('1234');
        createNote(message, burnDate)
            .then(id => {
                setCreatedNoteId(id);
            });
        return false;
    };

    const onMessageChange = (event: any) => {
        setMessageText(event.target.value);
    };

    const onTimeChange = (event: any) => {
        const nextValue = Number.parseInt(event.target.value);
        if (!isNaN(nextValue) && nextValue > 0)
            setTimeUntilRemoved(event.target.value);
        if (event.target.value === '') {
            setTimeUntilRemoved(-1);
        }
    };

    let app = (
        <p>This should never display...</p>
    );

    const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12})/g;
    if (noteFailed) {
        app = (
            <>
              <p>Could not load the note!</p>
            </>
        );
    } else if (uuidRegex.test(url.pathname)) {
        const matches = url.pathname.match(uuidRegex) as any;
        if (!noteLoading) {
            setNoteLoading(true);
            getNote(matches[0])
                .then(note => {
                    setNote(note);
                })
                .catch(() => {
                    setNoteFailed(true);
                });
        }
        app = (
            <>
              <p>
                You are viewing note: {matches[0]}
              </p>
              <p>
                Message: {note.message}
              </p>
              <p>
                Burns up at: {`${new Date(note.burnDate)}`}
              </p>
            </>
        );
    } else if (createdNoteId) {
        if (createdNoteId === '1234') {
            app = (
                <>
                  <p>Fixing the link to your note!</p>
                </>
            );
        } else {
            const linkText = `${url.origin}/${createdNoteId}`;
            app = (
                <>
                  <p>Here is the link to your message: {linkText}</p>
                </>
            );
        }
    } else {
        app = (
            <>
              <p>
                Enter your secret and get a link for it on screen!
              </p>
              <form>

                <label htmlFor="message">Message:</label>
                <input
                  type="text"
                  id="message"
                  value={messageText}
                  onChange={onMessageChange} /><br/>

                <label htmlFor="removalTime">Time until removed (s)</label>
                <input
                  type="text"
                  id="removalTime"
                  value={timeUntilRemoved > 0 ? timeUntilRemoved : ''}
                  onChange={onTimeChange} /><br/>
                <input type="submit" value="Submit" onClick={onClickSubmit} />
              </form>
            </>
        );
    }

    return (
        <div className="App">
          <header className="App-header">
            {app}
          </header>
        </div>
    );
};

export default App;
