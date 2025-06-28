# RTC Whiteboard Deployment Guide

## Render.com Deployment

This guide will help you deploy the RTC Whiteboard to Render.com using the `khanapcalculus/lcium` repository.

### Prerequisites

1. GitHub account with access to `khanapcalculus/lcium` repository
2. Render.com account (free tier is sufficient)

### Repository Setup

1. **Push your code to the repository:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Render.com Deployment Steps

1. **Create a new Web Service:**
   - Go to [Render.com Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select the `khanapcalculus/lcium` repository

2. **Configure the service:**
   - **Name:** `lcium` (or your preferred name)
   - **Environment:** `Node`
   - **Build Command:** `npm install && cd server && npm install && cd .. && npm run build`
   - **Start Command:** `cd server && npm start`
   - **Instance Type:** Free (sufficient for development)

3. **Environment Variables:**
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render's default)

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - The build process takes 5-10 minutes

### Post-Deployment

1. **Access your app:**
   - Your app will be available at: `https://lcium.onrender.com`
   - Or whatever custom name you chose: `https://[your-service-name].onrender.com`

2. **Test the deployment:**
   - Visit the URL in your browser
   - Create a room and test drawing
   - Open the same URL on another device/browser tab
   - Join the same room and test real-time collaboration

### Features Available in Production

✅ **Real-time collaborative drawing**
✅ **Cross-device synchronization**
✅ **Tablet-optimized interface**
✅ **Multiple drawing tools (pen, eraser, rectangle, circle)**
✅ **Room-based collaboration**
✅ **Automatic server URL detection**
✅ **WebSocket fallback to polling**

### Architecture

The deployed application includes:
- **Frontend:** React app with Konva for high-performance drawing
- **Backend:** Express.js server with Socket.IO for real-time communication
- **Database:** In-memory storage (rooms reset on server restart)

### Monitoring

- **Health Check:** `https://lcium.onrender.com/api/health`
- **Room List:** `https://lcium.onrender.com/api/rooms`
- **Render Logs:** Available in Render dashboard for debugging

### Troubleshooting

1. **Build fails:**
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in package.json

2. **App doesn't load:**
   - Check if the service is running in Render dashboard
   - Verify environment variables are set correctly

3. **Real-time features not working:**
   - Check browser console for WebSocket connection errors
   - Verify the app is using HTTPS (required for WebSocket on many networks)

4. **Performance issues:**
   - Free tier has limited resources
   - Consider upgrading to paid tier for production use

### Local Development vs Production

| Feature | Local | Production |
|---------|-------|------------|
| Frontend | `localhost:3000` | `https://lcium.onrender.com` |
| Backend | `localhost:3001` | `https://lcium.onrender.com` |
| WebSocket | HTTP | HTTPS/WSS |
| CORS | Permissive | Restricted to domain |
| File Serving | Separate servers | Single server |

### Next Steps for GoDaddy Migration

Once you're ready to move to your private GoDaddy hosting:

1. **Domain Setup:**
   - Point your custom domain to the Render service
   - Update CORS settings in server.js with your domain

2. **Custom Deployment:**
   - Export the built application
   - Set up Node.js environment on GoDaddy
   - Configure SSL certificates for WebSocket support

### Security Considerations

- The current setup allows room creation without authentication
- Consider adding user authentication for production use
- Room data is stored in memory and will be lost on server restart
- For persistent storage, consider adding a database (MongoDB, PostgreSQL)

---

**Support:** For issues with deployment, check the Render logs and browser console for error messages. 