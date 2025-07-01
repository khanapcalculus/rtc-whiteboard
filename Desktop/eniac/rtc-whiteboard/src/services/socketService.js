import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(serverUrl) {
    // Close any existing connection first
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Validate server URL
    if (!serverUrl) {
      console.error('Invalid server URL provided');
      return;
    }
    
    try {
      // Determine connection URL based on environment
      let connectionUrl;
      
      if (process.env.NODE_ENV === 'production') {
        // Production: WebSocket server runs on same domain
        connectionUrl = window.location.origin;
      } else {
        // Development: Use provided IP/URL
        connectionUrl = `http://${serverUrl}`;
      }
      
      console.log('Connecting to:', connectionUrl);
      
      // Create connection with proper error handling
      this.socket = io(connectionUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'] // Fallback for Render.com
      });
      
      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.isConnected = false;
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
      });
    } catch (error) {
      console.error('Error initializing socket connection:', error);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.warn(`Cannot register event '${event}': socket not initialized`);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
  
  // Add a method to check connection status
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

const socketService = new SocketService();
export default socketService;