# Eniac - Real-Time Collaborative Whiteboard

A modern, real-time collaborative whiteboard application built with React and Node.js.

## Features

- ✅ **Real-time collaboration** - Multiple users can draw simultaneously
- ✅ **Drawing tools** - Pen, rectangles, circles, lines, eraser
- ✅ **Image upload** - Upload and manipulate images
- ✅ **Selection tool** - Move and resize objects
- ✅ **Color palette** - Multiple colors and transparency
- ✅ **Stroke width** - Adjustable line thickness
- ✅ **Pan and zoom** - Navigate large canvases
- ✅ **Session persistence** - Drawings saved across sessions
- ✅ **Mobile support** - Touch and stylus compatible

## Local Development

### Prerequisites
- Node.js 18+ 
- npm 8+

### Setup
1. Clone the repository
2. Install dependencies: `npm run install-all`
3. Start backend: `npm run dev-backend`
4. Start frontend: `npm run dev-frontend`

## Render.com Deployment

### Automatic Deployment
This project is configured for automatic deployment on Render.com.

### Steps:
1. **Push to GitHub**: Ensure all changes are committed to `kahnapcalculus/eniac`
2. **Connect to Render**: 
   - Go to [render.com](https://render.com)
   - Create account/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repo: `kahnapcalculus/eniac`
3. **Configure Service**:
   - **Name**: `eniac-whiteboard` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or paid for better performance)
4. **Deploy**: Click "Create Web Service"

### Environment Variables (Optional)
- `NODE_ENV`: `production` (auto-set)
- `PORT`: Auto-assigned by Render

### What Gets Deployed
- ✅ **Full-stack application**: Both React frontend and Node.js backend
- ✅ **WebSocket server**: Real-time collaboration works
- ✅ **Session persistence**: Drawings saved to server storage
- ✅ **All features enabled**: Complete functionality

## Architecture

```
├── rtc-whiteboard/          # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── rtc-whiteboard-server/   # Node.js backend
│   ├── server.js           # Main server file
│   ├── sessions/           # Session storage
│   └── package.json
├── package.json            # Root deployment config
└── render.yaml            # Render.com configuration
```

## Technologies Used

- **Frontend**: React, Konva.js, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Deployment**: Render.com
- **Storage**: File-based session persistence

## License

MIT License 