const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors');
const {nanoid} = require('nanoid');

const app = express();
const PORT = 8000;
expressWs(app);

app.use(cors());
app.use(express.json());

const connections = {};
const pixels = [];

app.ws('/canvas', (ws, req) => {
    const id = nanoid();
    connections[id] = ws;
    console.log(`${id} connect on server. Total connected: ${Object.keys(connections).length}`);

    ws.send(JSON.stringify({
        type: 'LAST_PIXELS',
        pixels: pixels
    }));

    ws.on('message', msg => {
        const data = JSON.parse(msg);
        switch (data.type) {
            case 'CREATE_PIXELS':
                Object.keys(connections).forEach(connId => {
                    const conn = connections[connId];

                    conn.send(JSON.stringify({
                        type: 'NEW_PIXEL',
                        pixel: data.pixel
                    }));
                    pixels.push(data.pixel);
                });
                break;
            default:
                console.log('Wrong type');
        }
    });

    ws.on('close', (msg) => {
        console.log(`client disconnected id - ${id}`);
        delete connections[id];
    });
});

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});



