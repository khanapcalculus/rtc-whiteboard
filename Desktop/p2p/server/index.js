const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active connections
const rooms = {};
const socketToRoom = {};

app.get('/', (req, res) => {
  res.send('P2P Whiteboard Signaling Server is running');
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle room joining
  // Handle room joining
  socket.on('join-room', (roomID, userID) => {
    console.log(`User ${userID} joining room ${roomID}`);
    
    if (rooms[roomID]) {
      // Only allow two users per room (teacher and student)
      const length = rooms[roomID].length;
      if (length >= 2) {
        socket.emit('room-full');
        return;
      }
      rooms[roomID].push({id: userID, socketId: socket.id});
    } else {
      rooms[roomID] = [{id: userID, socketId: socket.id}];
    }
    
    socketToRoom[socket.id] = roomID;
    
    // Get the other user in the room
    const otherUsers = rooms[roomID].filter(user => user.id !== userID);
    socket.emit('users-in-room', otherUsers);
  });

  // Handle signaling
  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', {
      sdp: payload.sdp,
      caller: socket.id
    });
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', {
      sdp: payload.sdp,
      answerer: socket.id
    });
  });

  socket.on('ice-candidate', (payload) => {
    io.to(payload.target).emit('ice-candidate', {
      candidate: payload.candidate,
      sender: socket.id
    });
  });

  // Handle whiteboard data
  socket.on('whiteboard-data', (payload) => {
    const roomID = socketToRoom[socket.id];
    if (roomID) {
      socket.to(roomID).emit('whiteboard-data', payload);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const roomID = socketToRoom[socket.id];
    if (roomID) {
      let room = rooms[roomID];
      if (room) {
        room = room.filter(user => user.socketId !== socket.id);
        rooms[roomID] = room;
        if (room.length === 0) {
          delete rooms[roomID];
        } else {
          // Notify remaining users about the disconnection
          socket.to(roomID).emit('user-disconnected', socket.id);
        }
      }
    }
    delete socketToRoom[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});