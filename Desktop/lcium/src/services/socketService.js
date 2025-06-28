import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentRoom = null;
    this.userId = null;
    this.userColor = null;
  }

  // Determine the correct server URL based on the current environment
  getServerUrl() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production environment (Render.com)
    if (hostname.includes('onrender.com')) {
      return `${protocol}//${hostname}`;
    }
    
    // Local development - if accessing via IP address (like from tablet), use the same IP for server
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3001`;
    }
    
    // Default to localhost for local development
    return 'http://localhost:3001';
  }

  connect(serverUrl = null) {
    if (this.socket) {
      this.disconnect();
    }

    const targetUrl = serverUrl || this.getServerUrl();
    console.log(`🔌 Connecting to RTC server: ${targetUrl}`);

    this.socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log(`✅ Connected to RTC server at ${targetUrl}`);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`❌ Disconnected from RTC server. Reason: ${reason}`);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error(`❌ Connection error to ${targetUrl}:`, error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected to RTC server (attempt ${attemptNumber})`);
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
    }
  }

  // Room management
  joinRoom(roomId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected. Current status:', this.isConnected);
      return false;
    }

    this.currentRoom = roomId;
    this.socket.emit('join-room', roomId);
    console.log(`🏠 Joining room: ${roomId}`);
    return true;
  }

  createRoom() {
    const serverUrl = this.getServerUrl();
    console.log(`🏗️ Creating room via ${serverUrl}/api/create-room`);
    
    return fetch(`${serverUrl}/api/create-room`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log(`🏠 Room created: ${data.roomId}`);
        return data.roomId;
      })
      .catch(error => {
        console.error('❌ Failed to create room:', error);
        throw error;
      });
  }

  // Drawing events
  emitLineAdd(line) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('line-add', line);
    }
  }

  emitLineUpdate(lineData) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('line-update', lineData);
    }
  }

  emitLineRemove(lineId) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('line-remove', lineId);
    }
  }

  // Shape events
  emitShapeAdd(shape) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('shape-add', shape);
    }
  }

  emitShapeUpdate(shapeData) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('shape-update', shapeData);
    }
  }

  // Cursor events
  emitCursorMove(x, y) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('cursor-move', { x, y });
    }
  }

  // Event listeners
  onRoomState(callback) {
    if (this.socket) {
      this.socket.on('room-state', (data) => {
        this.userId = data.userId;
        this.userColor = data.userColor;
        callback(data);
      });
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  onLineAdd(callback) {
    if (this.socket) {
      this.socket.on('line-add', callback);
    }
  }

  onLineUpdate(callback) {
    if (this.socket) {
      this.socket.on('line-update', callback);
    }
  }

  onLineRemove(callback) {
    if (this.socket) {
      this.socket.on('line-remove', callback);
    }
  }

  onShapeAdd(callback) {
    if (this.socket) {
      this.socket.on('shape-add', callback);
    }
  }

  onShapeUpdate(callback) {
    if (this.socket) {
      this.socket.on('shape-update', callback);
    }
  }

  onCursorMove(callback) {
    if (this.socket) {
      this.socket.on('cursor-move', callback);
    }
  }

  // Cleanup
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Getters
  getConnectionStatus() {
    return this.isConnected;
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  getUserInfo() {
    return {
      userId: this.userId,
      userColor: this.userColor
    };
  }

  // Debug info
  getDebugInfo() {
    return {
      serverUrl: this.getServerUrl(),
      isConnected: this.isConnected,
      currentRoom: this.currentRoom,
      socketId: this.socket?.id,
      hostname: window.location.hostname
    };
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService; 