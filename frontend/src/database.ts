import express from 'express';

type Note = {
    message: string,
    burnDate: Date
};

type Log = {
    timeOfAccess: Date
};

const notes: {[key: string]: Note} = {};
const accesses: {[key: string]: number} = {};
const log: {[key: string]: Log} = {};

const main = () => {
    const app = express();
    app.use(express.json());

    app.get('/', (req: any, res: any) => {
        res.send('Hello World!');
    });

    app.post('/createNote', (req: any, res: any) => {
        const { message, burnDate } = req.body;
    });
};

if (require.main === module) {
    main();
}
