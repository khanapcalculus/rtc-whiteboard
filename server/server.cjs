const WebSocket = require('ws');
const http = require('http');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { LeveldbPersistence } = require('y-leveldb');

// Environment variables with defaults
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');
const NODE_ENV = process.env.NODE_ENV || 'development';

const wss = new WebSocket.Server({ noServer: true });

const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('okay');
});

// Initialize persistence
const ldb = new LeveldbPersistence('./storage-location');

// Create a document instance that syncs automatically
const doc = new Y.Doc();
const persistence = ldb.bindState('whiteboard-data', doc);

// Save document to disk every 10 seconds
setInterval(() => {
    ldb.storeUpdate('whiteboard-data', Y.encodeStateAsUpdate(doc));
}, 10000);

wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req, { 
        doc,
        gc: true // Enable garbage collection
    });
});

server.on('upgrade', (request, socket, head) => {
    // Add CORS headers for WebSocket
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.headers.origin) {
        headers['Access-Control-Allow-Origin'] = request.headers.origin;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        Object.entries(headers).forEach(([key, value]) => {
            ws.headers = ws.headers || {};
            ws.headers[key] = value;
        });
        wss.emit('connection', ws, request);
    });
});

const port = process.env.PORT || 3001;
server.listen(port, '0.0.0.0', () => {
    console.log(`WebSocket server is running on port ${port}`);
}); 