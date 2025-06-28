# Quick Deployment Checklist

## Pre-Deployment
- [ ] All code committed to `khanapcalculus/lcium` repository
- [ ] `render.yaml` configuration file present
- [ ] Server configured for production (CORS, static file serving)
- [ ] Socket service updated for production URLs

## Render.com Setup
- [ ] Render account created/logged in
- [ ] Repository connected to Render
- [ ] Web service created with correct settings:
  - [ ] Environment: Node
  - [ ] Build Command: `npm install && cd server && npm install && cd .. && npm run build`
  - [ ] Start Command: `cd server && npm start`
  - [ ] Environment Variables:
    - [ ] `NODE_ENV`: `production`
    - [ ] `PORT`: `10000`

## Post-Deployment Testing
- [ ] App loads at production URL
- [ ] Can create a room
- [ ] Drawing tools work (pen, eraser, rectangle, circle)
- [ ] Real-time collaboration works across multiple browsers/devices
- [ ] WebSocket connection established (check browser console)
- [ ] Health check endpoint responds: `/api/health`

## Production URLs
- **Main App:** `https://lcium.onrender.com`
- **Health Check:** `https://lcium.onrender.com/api/health`
- **Room List:** `https://lcium.onrender.com/api/rooms`

## Common Issues & Solutions
- **Build fails:** Check package.json dependencies
- **App doesn't load:** Verify environment variables in Render dashboard
- **WebSocket fails:** Ensure HTTPS is working, check browser console
- **Slow performance:** Expected on free tier, consider upgrading

---
**Note:** First deployment takes 5-10 minutes. Subsequent deployments are faster. 