# 🚀 RTC Whiteboard Setup Guide

## 📋 Prerequisites
- Node.js (v16 or higher)
- npm or yarn

## 🔧 Installation Steps

### 1. Install Client Dependencies
```bash
# In the main project directory
npm install
```

### 2. Install Server Dependencies
```bash
# Navigate to server directory
cd server
npm install
```

### 3. Start the Backend Server
```bash
# In the server directory
npm start
# OR for development with auto-restart
npm run dev
```
**Server will run on:** `http://localhost:3001`

### 4. Start the Frontend (New Terminal)
```bash
# In the main project directory (not server folder)
npm start
```
**Frontend will run on:** `http://localhost:3000`

## 🎯 How to Use RTC Features

### **Creating/Joining Rooms:**
1. **Click "Join/Create Room"** button in top-right corner
2. **Create New Room**: Click "Create New Room" for instant room
3. **Join Existing Room**: Enter room ID (e.g., "ABC123") and click "Join Room"
4. **Share Room ID**: Copy room ID and share with collaborators

### **Real-Time Collaboration:**
- ✅ **Drawing**: All pen strokes sync instantly
- ✅ **Erasing**: Deletions sync across all users
- ✅ **Shapes**: Rectangles and circles sync in real-time
- ✅ **User Presence**: See connected user count
- ✅ **Room Persistence**: Drawings saved until all users leave

### **Room Management:**
- **Room ID**: 6-character codes (e.g., "XYZ789")
- **Auto-cleanup**: Empty rooms are automatically deleted
- **User Colors**: Each user gets a unique color identifier
- **Connection Status**: Green = connected, Red = disconnected

## 🌐 Network Access

### **Local Network (Tablets/Other Devices):**
1. **Find your IP**: Check the terminal output when starting the frontend
2. **Access from tablet**: `http://192.168.31.158:3000` (your IP may differ)
3. **Ensure server is accessible**: Server should also be reachable at `http://192.168.31.158:3001`

### **Production Deployment:**
- **Frontend**: Deploy to Vercel, Netlify, or GitHub Pages
- **Backend**: Deploy to Heroku, Railway, or DigitalOcean
- **Update URLs**: Modify `socketService.js` with production server URL

## 🔧 Configuration

### **Server Configuration (server/server.js):**
```javascript
// Update CORS origins for production
cors: {
  origin: ["http://localhost:3000", "https://your-domain.com"],
  methods: ["GET", "POST"],
  credentials: true
}
```

### **Client Configuration (src/services/socketService.js):**
```javascript
// Update server URL for production
connect(serverUrl = 'https://your-server.com') {
  // ...
}
```

## 🚨 Troubleshooting

### **Connection Issues:**
- ✅ Ensure server is running on port 3001
- ✅ Check firewall settings
- ✅ Verify network connectivity
- ✅ Check browser console for errors

### **Room Issues:**
- ✅ Room IDs are case-sensitive
- ✅ Refresh page if connection is lost
- ✅ Check server logs for errors

### **Performance Issues:**
- ✅ Close unnecessary browser tabs
- ✅ Use modern browsers (Chrome, Firefox, Safari)
- ✅ Ensure stable internet connection

## 📱 Mobile/Tablet Usage

### **Optimized Features:**
- ✅ Touch drawing with all tools
- ✅ Pinch-to-zoom (disabled during drawing)
- ✅ Responsive room management UI
- ✅ Hardware-accelerated rendering

### **Best Practices:**
- Use landscape mode for better experience
- Ensure stable Wi-Fi connection
- Close background apps for performance

## 🎨 Features Overview

### **Real-Time Sync:**
- **Drawing**: Pen strokes appear instantly on all devices
- **Shapes**: Rectangles and circles sync during creation
- **Erasing**: Deletions remove content for all users
- **User Presence**: Live user count and status

### **Room Features:**
- **Instant Creation**: Generate rooms with one click
- **Easy Joining**: Simple 6-character room codes
- **Persistent State**: Drawings remain until room is empty
- **Auto-Cleanup**: Unused rooms are automatically removed

## 🔮 Next Steps

Ready to collaborate! Your RTC whiteboard now supports:
- ✅ Real-time drawing synchronization
- ✅ Multi-user collaboration
- ✅ Room-based sessions
- ✅ Cross-device compatibility
- ✅ Tablet-optimized experience

**Happy Collaborating!** 🎨✨ 