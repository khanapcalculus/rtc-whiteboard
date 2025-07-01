const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Persistence configuration
const DATA_DIR = path.join(__dirname, 'sessions');
const DEFAULT_SESSION = 'default';
let currentDrawings = {
  lines: [],
  shapes: []
};

// Initialize data directory
async function initializeDataDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('✅ Sessions directory initialized');
  } catch (error) {
    console.error('❌ Error creating sessions directory:', error);
  }
}

// Save drawings to file
async function saveSession(sessionId = DEFAULT_SESSION) {
  try {
    const filePath = path.join(DATA_DIR, `${sessionId}.json`);
    const data = {
      timestamp: new Date().toISOString(),
      drawings: currentDrawings,
      metadata: {
        totalLines: currentDrawings.lines.length,
        totalShapes: currentDrawings.shapes.length
      }
    };
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Session saved: ${sessionId} (${data.metadata.totalLines + data.metadata.totalShapes} objects)`);
    return true;
  } catch (error) {
    console.error('❌ Error saving session:', error);
    return false;
  }
}

// Load drawings from file
async function loadSession(sessionId = DEFAULT_SESSION) {
  try {
    const filePath = path.join(DATA_DIR, `${sessionId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    const session = JSON.parse(data);
    
    currentDrawings = session.drawings || { lines: [], shapes: [] };
    console.log(`📂 Session loaded: ${sessionId} (${session.metadata?.totalLines || 0} lines, ${session.metadata?.totalShapes || 0} shapes)`);
    return currentDrawings;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`📝 Creating new session: ${sessionId}`);
      currentDrawings = { lines: [], shapes: [] };
      await saveSession(sessionId);
    } else {
      console.error('❌ Error loading session:', error);
    }
    return currentDrawings;
  }
}

// Auto-save with throttling
let saveTimeout = null;
function scheduleAutoSave(sessionId = DEFAULT_SESSION) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    saveSession(sessionId);
  }, 2000); // Auto-save every 2 seconds after changes
}

// Initialize server
async function initialize() {
  await initializeDataDirectory();
  await loadSession(DEFAULT_SESSION);
  console.log('🚀 Persistence system ready');
}

io.on('connection', async (socket) => {
  console.log('👋 User connected:', socket.id);
  
  // Send existing drawings to new user
  socket.emit('session-loaded', {
    lines: currentDrawings.lines,
    shapes: currentDrawings.shapes,
    timestamp: new Date().toISOString()
  });

  // Handle line drawing events
  socket.on('line-created', (line) => {
    currentDrawings.lines.push(line);
    socket.broadcast.emit('line-created', line);
    scheduleAutoSave();
  });

  socket.on('line-updated', (updatedLine) => {
    const lineIndex = currentDrawings.lines.findIndex(line => line.id === updatedLine.id);
    if (lineIndex !== -1) {
      currentDrawings.lines[lineIndex] = updatedLine;
    }
    socket.broadcast.emit('line-updated', updatedLine);
    scheduleAutoSave();
  });

  socket.on('line-finished', (finishedLine) => {
    const lineIndex = currentDrawings.lines.findIndex(line => line.id === finishedLine.id);
    if (lineIndex !== -1) {
      currentDrawings.lines[lineIndex] = finishedLine;
    }
    socket.broadcast.emit('line-finished', finishedLine);
    scheduleAutoSave();
  });

  // Handle shape drawing events
  socket.on('shape-created', (shape) => {
    currentDrawings.shapes.push(shape);
    socket.broadcast.emit('shape-created', shape);
    scheduleAutoSave();
  });

  socket.on('shape-updated', (updatedShape) => {
    const shapeIndex = currentDrawings.shapes.findIndex(shape => shape.id === updatedShape.id);
    if (shapeIndex !== -1) {
      currentDrawings.shapes[shapeIndex] = updatedShape;
    }
    socket.broadcast.emit('shape-updated', updatedShape);
    scheduleAutoSave();
  });

  socket.on('shape-finished', (finishedShape) => {
    const shapeIndex = currentDrawings.shapes.findIndex(shape => shape.id === finishedShape.id);
    if (shapeIndex !== -1) {
      currentDrawings.shapes[shapeIndex] = finishedShape;
    }
    socket.broadcast.emit('shape-finished', finishedShape);
    scheduleAutoSave();
  });

  // Manual save/load functionality
  socket.on('save-session', async (sessionId) => {
    const success = await saveSession(sessionId || DEFAULT_SESSION);
    socket.emit('save-response', { success, sessionId: sessionId || DEFAULT_SESSION });
  });

  socket.on('load-session', async (sessionId) => {
    const drawings = await loadSession(sessionId || DEFAULT_SESSION);
    io.emit('session-loaded', {
      lines: drawings.lines,
      shapes: drawings.shapes,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || DEFAULT_SESSION
    });
  });

  // Clear session
  socket.on('clear-session', async () => {
    currentDrawings = { lines: [], shapes: [] };
    await saveSession(DEFAULT_SESSION);
    io.emit('session-cleared');
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

// Graceful shutdown - save before exit
process.on('SIGTERM', async () => {
  console.log('📥 Shutting down gracefully...');
  await saveSession(DEFAULT_SESSION);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📥 Shutting down gracefully...');
  await saveSession(DEFAULT_SESSION);
  process.exit(0);
});

const PORT = process.env.PORT || 3001;

// Start server
initialize().then(() => {
  server.listen(PORT, () => {
    console.log(`🎨 Whiteboard server running on port ${PORT}`);
    console.log(`💾 Session data stored in: ${DATA_DIR}`);
  });
});