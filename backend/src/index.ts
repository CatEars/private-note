import express from 'express';
import uuid from 'uuid';

type Note = {
    message: string,
    burnDate: number
};

type Log = {
    ip: string,
    timeOfAccess: number
};

const notes: {[key: string]: Note} = {};
const accessesLeft: {[key: string]: number} = {};
const log: {[key: string]: Log[]} = {};

const createNote = (note: Note) => {
    const id = uuid.v4();
    notes[id] = note;
    accessesLeft[id] = 1;
    log[id] = [];
    return id;
};

const deleteNote = (id: string) => {
    delete notes[id];
    delete accessesLeft[id];
};

const createLog = (request: express.Request, id: string) => {
    const logEntry: Log = {
        ip: request.ip,
        timeOfAccess: Date.now()
    };
    if (id && log[id]) {
        log[id].push(logEntry);
    } else {
        console.warn('Log entry', logEntry, 'did not find any ID');
    }
};

const validateNoteBody = (msg: any) => {
    return;
}

const cleanMessages = () => {
    const keys = Object.keys(notes);
    const toRemove = keys.filter(key => (
        notes[key].burnDate < Date.now() || accessesLeft[key] <= 0
    ));
    toRemove.map(key => deleteNote(key));
}

const main = () => {
    const app = express();
    app.use(express.json());
    app.use(express.static('./static'));

    app.get('/api/note/:ID', (req: any, res: any) => {
        const { ID } = req.params;
        createLog(req, ID);
        if (ID && notes[ID] && accessesLeft[ID] > 0 &&
            Date.now() < notes[ID].burnDate) {
            accessesLeft[ID]--;
            res.send(notes[ID]);
        } else {
            res.sendStatus(404);
        }
    });

    app.post('/api/note', (req: any, res: any) => {
        validateNoteBody(req.body);
        const { message, burnDate } = req.body;
        const ID = createNote({ message, burnDate });
        res.send({ ID });
    });

    app.delete('/api/note/:ID', (req: any, res: any) => {
        const { ID } = req.params;
        if (ID) {
            deleteNote(ID);
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    });

    app.get('/*', (req: any, res: any) => {
        res.sendFile(process.cwd() + '/./static/index.html');
    });


    app.listen(3000);
};

if (require.main === module) {
    process.on('SIGINT', function() {
        console.log("Caught interrupt signal");
        process.exit();
    });

    setInterval(() => {
        console.log('NOTES:', notes);
        console.log('LOGS:', log);
        cleanMessages();
    }, 5000);

    main();
}
