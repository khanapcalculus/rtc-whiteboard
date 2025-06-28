const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Get local IP address for better logging
const os = require('os');
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
};

const localIP = getLocalIP();
const isProduction = process.env.NODE_ENV === 'production';

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: isProduction ? ["https://rtc-whiteboard.onrender.com", "https://lcium.onrender.com"] : "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configure Express CORS
app.use(cors({
  origin: isProduction ? ["https://rtc-whiteboard.onrender.com", "https://lcium.onrender.com"] : "*",
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// Serve static files from React build in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../build')));
}

// Store room data
const rooms = new Map();

// Utility functions
const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const generateUserId = () => Math.random().toString(36).substring(2, 10);

const getUserColor = (userId) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👋 User connected: ${socket.id} from ${socket.handshake.address}`);
  
  let currentRoom = null;
  let userId = generateUserId();
  let userColor = getUserColor(userId);

  // Join or create room
  socket.on('join-room', (roomId) => {
    console.log(`🏠 User ${userId} attempting to join room: ${roomId}`);
    
    // Leave current room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      const room = rooms.get(currentRoom);
      if (room) {
        room.users.delete(socket.id);
        socket.to(currentRoom).emit('user-left', {
          userId: socket.id,
          userCount: room.users.size
        });
      }
    }

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        lines: [],
        shapes: [],
        users: new Map()
      });
      console.log(`🏗️ Created new room: ${roomId}`);
    }

    const room = rooms.get(roomId);
    currentRoom = roomId;
    
    // Add user to room
    room.users.set(socket.id, {
      id: userId,
      color: userColor,
      socketId: socket.id
    });

    socket.join(roomId);

    // Send current room state to new user
    socket.emit('room-state', {
      roomId,
      lines: room.lines,
      shapes: room.shapes,
      users: Array.from(room.users.values()),
      userId,
      userColor
    });

    // Notify others about new user
    socket.to(roomId).emit('user-joined', {
      userId,
      userColor,
      userCount: room.users.size
    });

    console.log(`✅ User ${userId} joined room ${roomId} (${room.users.size} users total)`);
  });

  // Handle drawing events
  socket.on('line-add', (data) => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (room) {
      const lineWithUser = {
        ...data,
        userId,
        userColor,
        timestamp: Date.now()
      };
      room.lines.push(lineWithUser);
      socket.to(currentRoom).emit('line-add', lineWithUser);
    }
  });

  socket.on('line-update', (data) => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (room) {
      const lineIndex = room.lines.findIndex(line => line.id === data.id);
      if (lineIndex >= 0) {
        room.lines[lineIndex] = { ...room.lines[lineIndex], ...data };
        socket.to(currentRoom).emit('line-update', data);
      }
    }
  });

  socket.on('line-remove', (lineId) => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (room) {
      room.lines = room.lines.filter(line => line.id !== lineId);
      socket.to(currentRoom).emit('line-remove', lineId);
    }
  });

  // Handle shape events
  socket.on('shape-add', (data) => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (room) {
      const shapeWithUser = {
        ...data,
        userId,
        userColor,
        timestamp: Date.now()
      };
      room.shapes.push(shapeWithUser);
      socket.to(currentRoom).emit('shape-add', shapeWithUser);
    }
  });

  socket.on('shape-update', (data) => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (room) {
      const shapeIndex = room.shapes.findIndex(shape => shape.id === data.id);
      if (shapeIndex >= 0) {
        room.shapes[shapeIndex] = { ...room.shapes[shapeIndex], ...data };
        socket.to(currentRoom).emit('shape-update', data);
      }
    }
  });

  // Handle cursor movement
  socket.on('cursor-move', (data) => {
    if (!currentRoom) return;
    
    socket.to(currentRoom).emit('cursor-move', {
      userId,
      userColor,
      x: data.x,
      y: data.y
    });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`👋 User ${userId} disconnected: ${socket.id} (reason: ${reason})`);
    
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.users.delete(socket.id);
        socket.to(currentRoom).emit('user-left', {
          userId: socket.id,
          userCount: room.users.size
        });

        // Clean up empty rooms
        if (room.users.size === 0) {
          rooms.delete(currentRoom);
          console.log(`🗑️ Room ${currentRoom} deleted (empty)`);
        }
      }
    }
  });
});

// API Routes
app.get('/api/create-room', (req, res) => {
  const roomId = generateRoomId();
  console.log(`🏗️ API: Created room ${roomId}`);
  res.json({ roomId });
});

app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([id, room]) => ({
    id,
    userCount: room.users.size,
    itemCount: room.lines.length + room.shapes.length
  }));
  res.json(roomList);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve React app for all other routes in production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

const PORT = process.env.PORT || 3001;

// Listen on all interfaces
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RTC Whiteboard Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (isProduction) {
    console.log(`🌐 Production URL: https://lcium.onrender.com`);
  } else {
    console.log(`🌐 Local access: http://localhost:${PORT}`);
    console.log(`📱 Network access: http://${localIP}:${PORT}`);
    console.log(`🔗 Tablet URL: http://${localIP}:3000`);
  }
});

module.exports = { app, server }; 