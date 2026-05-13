# Deployment Configuration Guide

## Overview

This project is configured for deployment on:
- **Frontend:** Vercel (recommended for React/Vite apps)
- **Backend:** Render, Railway, or Docker-based platforms

All configuration files and build outputs have been verified.

---

## Frontend Deployment (Vercel)

### Configuration File
**File:** `frontend/vercel.json`

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Build Output
- **Command:** `npm run build`
- **Output Directory:** `dist/`
- **Output Size:** ~350KB (gzipped: ~105KB)
- **Files:** 
  - `dist/index.html` (0.49 KB)
  - `dist/assets/*.css` (43.98 KB)
  - `dist/assets/*.js` (307.88 KB)

### Deployment Steps

#### Option 1: Connect GitHub Repository (Recommended)
```bash
1. Push code to GitHub
2. Go to vercel.com
3. Click "New Project"
4. Select your GitHub repository
5. Vercel auto-detects Vite configuration
6. Set Environment Variables:
   VITE_API_URL=https://designhub-api.render.com
7. Click Deploy
```

#### Option 2: Deploy via CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (from frontend directory)
cd frontend
vercel
```

### Environment Variables (Vercel Dashboard)
```
VITE_API_URL=https://your-backend-url.com
```

### Verify Deployment
```bash
# Your frontend will be at:
https://your-project.vercel.app

# Test API connection:
curl https://your-project.vercel.app/api/health
# (frontend will proxy to backend via env var)
```

### Build Configuration Verified ✅
- Output directory: `dist/` ✓
- Build command: `npm run build` ✓
- Dev command: `vite` ✓
- No critical warnings ✓

---

## Backend Deployment (Render)

### Configuration File
**File:** `backend/render.yaml`

```yaml
services:
  - type: web
    name: designhub-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
```

### Build Output
- **Command:** `npm start` (runs `node server.js`)
- **Port:** 5000
- **Health Check:** GET `/api/health`
- **Ready Check:** GET `/api/ready`

### Deployment Steps

#### Option 1: Connect GitHub Repository (Recommended)
```bash
1. Go to render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: designhub-api
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start
   - Root Directory: backend
5. Set Environment Variables (in dashboard):
   NODE_ENV=production
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/designhub
   JWT_SECRET=your-secret-key-here (min 32 chars)
   CLOUDINARY_CLOUD_NAME=your-account
   CLOUDINARY_API_KEY=your-key
   CLOUDINARY_API_SECRET=your-secret
   CORS_ORIGINS=https://your-frontend.vercel.app
6. Click Deploy
```

#### Option 2: Deploy from CLI
```bash
# Install Render CLI
npm install -g @render-samples/render-cli

# Login and deploy
render login
render create
```

### Environment Variables (Render Dashboard)
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=... (min 32 chars)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CORS_ORIGINS=https://your-frontend.vercel.app
CORS_CREDENTIALS=true
```

### Health Checks (Render Dashboard)
- **Health Check Path:** `/api/health`
- **Interval:** 30 seconds
- **Timeout:** 10 seconds

### Verify Deployment
```bash
# Your backend will be at:
https://designhub-api.onrender.com

# Test health endpoint:
curl https://designhub-api.onrender.com/api/health
# Response: { "success": true, "message": "...", "environment": "production" }

# Test readiness endpoint:
curl https://designhub-api.onrender.com/api/ready
# Response: { "success": true, "ready": true, "database": "connected" }
```

---

## Backend Deployment (Railway)

### Configuration File
**File:** `backend/railway.json`

```json
{
  "build": {
    "builder": "dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckUrl": "http://localhost:5000/api/health"
  }
}
```

### Dockerfile
**File:** `backend/Dockerfile`

- Multi-stage build (dependencies separate from runtime)
- Alpine Linux (small image ~200MB)
- Non-root user (security best practice)
- Health check built-in
- dumb-init for proper signal handling

### Deployment Steps

```bash
1. Go to railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your repository
5. Select branch (main)
6. Railway auto-detects render.yaml and railway.json
7. Set Environment Variables in Railway dashboard
8. Deploy
```

### Verify Deployment
```bash
# Your backend will be at:
https://designhub-api-xyz.railway.app

# Test endpoint:
curl https://designhub-api-xyz.railway.app/api/health
```

---

## Backend Deployment (Docker - Local Testing)

### Build Docker Image
```bash
cd backend

# Build image
docker build -t designhub-api:latest .

# Verify image
docker images | grep designhub-api
```

### Run Docker Container (Local)
```bash
# Run with environment variables
docker run -p 5000:5000 \
  -e NODE_ENV=development \
  -e MONGO_URI=mongodb://mongodb:27017/designhub \
  -e JWT_SECRET=your-secret-key \
  designhub-api:latest

# Or with .env file
docker run -p 5000:5000 \
  --env-file .env \
  designhub-api:latest
```

### Docker Compose (Backend + MongoDB)
```bash
# Create docker-compose.yml (optional)
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/designhub
    depends_on:
      - mongo
  
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:

# Run with Docker Compose
docker-compose up -d
```

### Verify Docker Container
```bash
# Check container status
docker ps | grep designhub-api

# View logs
docker logs designhub-api

# Test endpoint
curl http://localhost:5000/api/health

# Stop container
docker stop designhub-api
```

### Docker Configuration Verified ✅
- Build layers optimized ✓
- Small final image size ✓
- Health check included ✓
- Non-root user configured ✓
- Proper signal handling (dumb-init) ✓

---

## Deployment Checklist

### Before Deploying Frontend

- [ ] Build locally: `cd frontend && npm run build`
- [ ] Verify dist/ folder created
- [ ] Check build size is reasonable (<500KB total)
- [ ] Set VITE_API_URL in Vercel environment
- [ ] Test API endpoint connectivity

### Before Deploying Backend

- [ ] Build locally: `cd backend && npm install && npm start`
- [ ] Test health endpoint: `curl http://localhost:5000/api/health`
- [ ] Test ready endpoint: `curl http://localhost:5000/api/ready`
- [ ] Create MongoDB Atlas account and get connection string
- [ ] Generate JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Configure Cloudinary account and get credentials
- [ ] Set all required environment variables in deployment platform
- [ ] Verify CORS_ORIGINS matches deployed frontend URL

### After Deploying

- [ ] Test frontend loads: `https://your-project.vercel.app`
- [ ] Test backend health: `https://your-backend-url.com/api/health`
- [ ] Test API integration: Try login/register flow
- [ ] Check logs for errors
- [ ] Monitor for 24 hours (warm-up period)

---

## Environment Variables Reference

### Frontend (Vercel)
```
VITE_API_URL=https://designhub-api.onrender.com
```

### Backend (All Platforms)
```
# Required
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/designhub
JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRE=7d

# Optional but Recommended
CLOUDINARY_CLOUD_NAME=your-account
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Security (CORS)
CORS_ORIGINS=https://your-frontend.vercel.app,https://www.your-frontend.vercel.app
CORS_CREDENTIALS=true

# Rate Limiting (optional - uses defaults if not set)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5
UPLOAD_RATE_LIMIT_WINDOW_MS=3600000
UPLOAD_RATE_LIMIT_MAX_REQUESTS=20
COMMENT_RATE_LIMIT_WINDOW_MS=3600000
COMMENT_RATE_LIMIT_MAX_REQUESTS=30
```

---

## File Structure

```
frontend/
├── vercel.json         # Vercel deployment config
├── .vercelignore       # Files to ignore during deploy
└── dist/               # Build output (created by npm run build)

backend/
├── Dockerfile          # Docker image definition
├── .dockerignore       # Files to ignore in Docker
├── render.yaml         # Render deployment config
├── railway.json        # Railway deployment config
├── Procfile            # Heroku-compatible process definition
├── server.js           # Entry point (runs on npm start)
└── package.json        # Dependencies and scripts
```

---

## Recommended Setup

### Best Combination (Lowest Cost)
1. **Frontend:** Vercel (free tier available)
2. **Backend:** Render (free tier available, auto-sleep after 15 min inactivity)
3. **Database:** MongoDB Atlas (free tier available)
4. **Image Upload:** Cloudinary (free tier: 25GB storage)

### Production Setup (Most Reliable)
1. **Frontend:** Vercel Pro
2. **Backend:** Railway (pay-as-you-go, always running)
3. **Database:** MongoDB Atlas M1 cluster
4. **Image Upload:** Cloudinary Pro tier

### Quick Start (5 minutes)
```bash
# 1. Fork repo on GitHub
# 2. Deploy frontend to Vercel
#    - Connect GitHub repo
#    - Set VITE_API_URL
#    - Click Deploy
# 3. Deploy backend to Render
#    - Connect GitHub repo
#    - Set environment variables
#    - Click Deploy
# 4. Update CORS_ORIGINS to new frontend URL
# 5. Done!
```

---

## Troubleshooting

### Frontend builds but shows blank page
- Check browser console for API errors
- Verify VITE_API_URL environment variable is set
- Check backend is accessible from frontend URL

### Backend health check fails
- Verify MongoDB connection string is correct
- Check environment variables are set in deployment platform
- View backend logs for detailed error messages

### API returns 503 (Service Unavailable)
- Render free tier may auto-sleep after 15 min inactivity
- Deploy to Railway or upgrade Render plan for always-on service
- Check /api/ready endpoint for database status

### CORS errors on frontend
- Update backend CORS_ORIGINS to include frontend URL
- Restart backend after changing CORS_ORIGINS
- Check frontend is using correct VITE_API_URL

---

**Last Updated:** February 17, 2026
**Status:** ✅ All deployment configs verified and ready
