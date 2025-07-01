const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Enable CORS for all origins in development, restrict in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-app-name.onrender.com'] 
    : '*',
  methods: ['GET', 'POST']
};

app.use(cors(corsOptions));

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../rtc-whiteboard/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../rtc-whiteboard/build', 'index.html'));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

// Session management
const SESSION_FILE = path.join(__dirname, 'sessions', 'default.json');

// Load session data
let sessionData = { timestamp: new Date().toISOString(), drawings: { lines: [], shapes: [] } };

function loadSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = fs.readFileSync(SESSION_FILE, 'utf8');
      sessionData = JSON.parse(data);
      console.log('Session loaded successfully');
    }
  } catch (error) {
    console.error('Error loading session:', error);
    sessionData = { timestamp: new Date().toISOString(), drawings: { lines: [], shapes: [] } };
  }
}

function saveSession() {
  try {
    sessionData.timestamp = new Date().toISOString();
    
    // Ensure sessions directory exists
    const sessionsDir = path.dirname(SESSION_FILE);
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }
    
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));
    console.log('Session saved successfully');
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

// Initialize session on startup
loadSession();

// Keep track of all connected clients
const connectedClients = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  connectedClients.add(socket.id);
  
  // Emit the current number of connected clients
  io.emit('client-count', connectedClients.size);
  
  // Send current session data to the new client
  socket.emit('session-data', sessionData.drawings);
  
  // Handle line drawing events
  socket.on('line-created', (line) => {
    // Add to session
    if (!sessionData.drawings.lines) sessionData.drawings.lines = [];
    sessionData.drawings.lines.push(line);
    saveSession();
    
    // Broadcast to all clients except the sender
    socket.broadcast.emit('line-created', line);
  });
  
  socket.on('line-updated', (line) => {
    // Update in session
    if (sessionData.drawings.lines) {
      const index = sessionData.drawings.lines.findIndex(l => l.id === line.id);
      if (index !== -1) {
        sessionData.drawings.lines[index] = line;
        saveSession();
      }
    }
    socket.broadcast.emit('line-updated', line);
  });
  
  socket.on('line-finished', (line) => {
    // Update in session
    if (sessionData.drawings.lines) {
      const index = sessionData.drawings.lines.findIndex(l => l.id === line.id);
      if (index !== -1) {
        sessionData.drawings.lines[index] = line;
        saveSession();
      }
    }
    socket.broadcast.emit('line-finished', line);
  });
  
  // Handle shape drawing events
  socket.on('shape-created', (shape) => {
    console.log('Broadcasting shape-created:', shape);
    
    // Add to session
    if (!sessionData.drawings.shapes) sessionData.drawings.shapes = [];
    sessionData.drawings.shapes.push(shape);
    saveSession();
    
    socket.broadcast.emit('shape-created', shape);
  });
  
  socket.on('shape-updated', (shape) => {
    console.log('Broadcasting shape-updated:', shape);
    
    // Update in session
    if (sessionData.drawings.shapes) {
      const index = sessionData.drawings.shapes.findIndex(s => s.id === shape.id);
      if (index !== -1) {
        sessionData.drawings.shapes[index] = shape;
        saveSession();
      }
    }
    socket.broadcast.emit('shape-updated', shape);
  });
  
  socket.on('shape-finished', (shape) => {
    console.log('Broadcasting shape-finished:', shape);
    
    // Update in session
    if (sessionData.drawings.shapes) {
      const index = sessionData.drawings.shapes.findIndex(s => s.id === shape.id);
      if (index !== -1) {
        sessionData.drawings.shapes[index] = shape;
        saveSession();
      }
    }
    socket.broadcast.emit('shape-finished', shape);
  });

  // Handle object deletion events
  socket.on('object-deleted', (deletedObject) => {
    console.log('Broadcasting object-deleted:', deletedObject);
    
    // Remove from session
    if (deletedObject.id) {
      // Remove from shapes
      if (sessionData.drawings.shapes) {
        sessionData.drawings.shapes = sessionData.drawings.shapes.filter(s => s.id !== deletedObject.id);
      }
      // Remove from lines
      if (sessionData.drawings.lines) {
        sessionData.drawings.lines = sessionData.drawings.lines.filter(l => l.id !== deletedObject.id);
      }
    } else {
      // For objects without ID (old pen drawings), match by properties
      if (sessionData.drawings.lines) {
        sessionData.drawings.lines = sessionData.drawings.lines.filter(l => {
          return !(l.tool === deletedObject.tool && 
                   JSON.stringify(l.points) === JSON.stringify(deletedObject.points) &&
                   l.color === deletedObject.color);
        });
      }
    }
    saveSession();
    
    socket.broadcast.emit('object-deleted', deletedObject);
  });

  // Handle clear session events
  socket.on('clear-session', () => {
    console.log('Clearing session');
    
    // Clear session data
    sessionData.drawings = { lines: [], shapes: [] };
    saveSession();
    
    // Broadcast clear to all clients (including sender)
    io.emit('session-cleared');
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedClients.delete(socket.id);
    io.emit('client-count', connectedClients.size);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});