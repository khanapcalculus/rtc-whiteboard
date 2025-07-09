const WebSocket = require('ws');
const http = require('http');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');

const wss = new WebSocket.Server({ noServer: true });

const port = process.env.PORT || 3001;

const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('okay');
});

const doc = new Y.Doc();

wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req, { doc });
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
}); 