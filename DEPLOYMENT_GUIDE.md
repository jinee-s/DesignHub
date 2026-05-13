# 🚀 DesignHub - Production Deployment Guide

A comprehensive guide to deploying DesignHub (backend + frontend) to production environments.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Monitoring & Health Checks](#monitoring--health-checks)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production, verify all items:

### Code Quality
- [ ] All console.log() calls removed (use logger instead)
- [ ] No hardcoded secrets or credentials
- [ ] Error messages are user-friendly (no stack traces in production)
- [ ] All environment variables are documented in `.env.example`
- [ ] Build passes without warnings

### Database
- [ ] MongoDB Atlas cluster created and connection string ready
- [ ] Database backups configured
- [ ] Connection pooling set to 10+ for production
- [ ] Indexes created for performance

### Security
- [ ] HTTPS enabled for all endpoints
- [ ] CORS whitelist includes only production domains
- [ ] JWT secret is 32+ characters and securely generated
- [ ] Rate limiting configured appropriately
- [ ] Helmet security headers enabled

### Monitoring
- [ ] Application logging configured
- [ ] Error tracking (Sentry, LogRocket, etc.) set up
- [ ] Uptime monitoring configured (Pingdom, UptimeRobot)
- [ ] Performance monitoring enabled

---

## Backend Deployment

### Option 1: Render.com (Recommended for beginners)

**Pros:** Free tier, auto-deploys from GitHub, simple configuration

**Steps:**

1. **Connect GitHub Repository**
   - Push code to GitHub
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Select your GitHub repo
   - Choose branch: `main` or `production`

2. **Configure Service**
   - **Name:** `designhub-api`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

3. **Set Environment Variables**
   - Click "Environment"
   - Add all variables from `.env.example`:
     ```
     NODE_ENV=production
     PORT=5000
     MONGO_URI=mongodb+srv://...
     JWT_SECRET=<generate secure key>
     JWT_EXPIRE=7d
     CLOUDINARY_CLOUD_NAME=...
     CLOUDINARY_API_KEY=...
     CLOUDINARY_API_SECRET=...
     CLIENT_URL=https://your-frontend-domain.com
     LOG_LEVEL=warn
     ```

4. **Deploy**
   - Click "Deploy"
   - Monitor logs: `tail -f <service>.log`
   - Verify: `curl https://<service>.onrender.com/api/health`

### Option 2: AWS (EC2 + RDS)

**Pros:** Scalable, professional, cost-effective

**Steps:**

1. **Launch EC2 Instance**
   ```bash
   # Ubuntu 22.04 LTS recommended
   # Connect via SSH
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 (process manager)
   sudo npm install -g pm2
   
   # Clone repository
   git clone https://github.com/yourusername/designhub.git
   cd designhub/backend
   npm install
   ```

2. **Create `.env` file**
   ```bash
   nano .env
   # Fill in production values
   ```

3. **Start with PM2**
   ```bash
   pm2 start server.js --name "designhub-api"
   pm2 save
   pm2 startup
   ```

4. **Configure nginx (reverse proxy)**
   ```bash
   sudo apt-get install -y nginx
   
   # Create config at /etc/nginx/sites-available/designhub
   # Point to http://localhost:5000
   # Enable HTTPS with Let's Encrypt
   ```

5. **Enable SSL Certificate**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Option 3: Heroku (Legacy - charges apply)

```bash
# Login
heroku login

# Create app
heroku create designhub-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=mongodb+srv://...
# ... set all other vars

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

---

## Frontend Deployment

### Option 1: Netlify (Easiest)

**Steps:**

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build  # Outputs to dist/
   ```

2. **Connect to Netlify**
   - Go to https://netlify.com
   - Connect GitHub repository
   - **Build Command:** `npm --prefix frontend run build`
   - **Publish Directory:** `frontend/dist`
   - **Environment Variables:**
     ```
     VITE_API_BASE_URL=https://api.yourdomain.com
     ```

3. **Deploy**
   - Set domain: Settings → Site Settings → Change site name
   - Enable HTTPS (automatic)
   - Test: Open deployed URL

### Option 2: Vercel

**Steps:**

1. **Deploy**
   ```bash
   npm install -g vercel
   vercel
   # Choose: frontend folder
   # Vercel auto-detects Next.js/Vite setup
   ```

2. **Set Environment Variables**
   - Dashboard → Settings → Environment Variables
   - Add `VITE_API_BASE_URL`

3. **Custom Domain**
   - Add domain in Dashboard

### Option 3: AWS S3 + CloudFront (Cost-effective for scale)

```bash
# Build React app
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

---

## Environment Configuration

### Production Environment Variables

**Backend (.env):**
```env
# Server
NODE_ENV=production
PORT=5000  # Ignored on Render/Heroku, they assign PORT

# Database - MongoDB Atlas (production)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/designhub?retryWrites=true&w=majority

# JWT - Generate secure key
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=dsbp1n8mr
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Frontend URL for CORS
CLIENT_URL=https://your-frontend-domain.com

# Logging
LOG_LEVEL=warn  # Only warnings and errors in production
```

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### How to Set Environment Variables

**Render.com:**
- Dashboard → Environment tab → Add variables

**Netlify:**
- Site Settings → Build & Deploy → Environment → Add environment variables

**AWS/EC2:**
```bash
# In .env file
nano backend/.env
# Fill in production values
```

**GitHub Actions (Auto-deploy on push):**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST https://api.render.com/deploy/srv-xxxx?key=$RENDER_API_KEY
```

---

## Monitoring & Health Checks

### Health Check Endpoints

**1. Basic Health Check**
```bash
curl https://api.yourdomain.com/api/health
```

Response:
```json
{
  "success": true,
  "message": "DesignHub API is running! 🚀",
  "environment": "production",
  "timestamp": "2026-02-16T17:53:03.949Z"
}
```

**2. Readiness Check** (for Kubernetes/orchestration)
```bash
curl https://api.yourdomain.com/api/ready
```

Response:
```json
{
  "success": true,
  "message": "DesignHub API is ready to serve requests",
  "ready": true,
  "database": "connected",
  "environment": "production",
  "timestamp": "2026-02-16T17:53:16.680Z"
}
```

### Configure Monitoring Tools

**Render.com:**
- Built-in uptime monitoring
- Integration with Slack/email alerts

**UptimeRobot (Free):**
1. Go to https://uptimerobot.com
2. Add new monitor: `https://api.yourdomain.com/api/health`
3. Set interval: 5 minutes
4. Enable alerts

**DataDog or New Relic:**
1. Install agent
2. Configure dashboards
3. Set up alerts for:
   - Error rate > 5%
   - Response time > 1s
   - Database connection drops

---

## Database Configuration

### MongoDB Atlas Setup (Production)

1. **Create Cluster**
   - Go to https://cloud.mongodb.com
   - Create M0 (free) or M2+ cluster
   - Choose region closest to deployment

2. **Configure Network Access**
   - IP Whitelist: Add your deployment IP (or 0.0.0.0 for Render)
   - Create database user with strong password

3. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster-xyz.mongodb.net/designhub?retryWrites=true&w=majority
   ```

4. **Enable Backups**
   - Settings → Backup → Enable automated backups
   - Retention: 30 days

### Connection Pooling

Backend already configured with:
- Pool size: 10 connections
- Retry logic: 5 attempts with exponential backoff
- Timeout: 30 seconds for server selection

No changes needed!

---

## Troubleshooting

### "Connection refused" / "Cannot connect to database"

**Solutions:**
1. Verify MongoDB is running: `mongod --version`
2. Check MONGO_URI format: `mongodb+srv://user:pass@host/db`
3. Verify IP whitelist in MongoDB Atlas
4. Check network connectivity: `ping cloud.mongodb.com`

### "Rate limit exceeded" (429 errors)

**Solutions:**
1. Increase rate limit in `src/middleware/rateLimiter.js`
2. Use different IP for testing
3. Contact support if being DDoS'd

### "Memory leak" / High RAM usage

**Solutions:**
1. Restart process: `pm2 restart designhub-api`
2. Check for infinite loops or memory-intensive operations
3. Monitor with: `pm2 monit`

### "CORS error" from frontend

**Solutions:**
1. Verify frontend domain in `CLIENT_URL` env var
2. Ensure https used in production
3. Check browser console for exact error
4. Reload browser (hard refresh: Ctrl+F5)

### "500 Error" / "Internal Server Error"

**Solutions:**
1. Check server logs: `pm2 logs designhub-api`
2. Verify all environment variables set
3. Check database connectivity
4. Reset database: Drop and recreate (dev only!)

### Performance Issues / Slow Response Time

**Solutions:**
1. Check database indexes: `db.designs.getIndexes()`
2. Monitor database queries with logging
3. Implement caching for GET `/api/designs`
4. Use CDN for image delivery (Cloudinary already does this!)

---

## Security Checklist - Production

- [ ] HTTPS enabled for all traffic
- [ ] Environment variables NOT in git repository
- [ ] `.env` file in `.gitignore`
- [ ] JWT_SECRET rotated regularly
- [ ] CORS whitelist strict (only production domain)
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled
- [ ] No console.log() or debug endpoints exposed
- [ ] Database credentials rotated periodically
- [ ] API key rotation policy in place

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check frontend loads
curl https://yourdomain.com/

# Check API health
curl https://api.yourdomain.com/api/health

# Test registration
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Password123!"}'
```

### 2. Monitor Logs

```bash
# Render.com
# Logs visible in dashboard → Logs tab

# AWS EC2
pm2 logs designhub-api

# Local testing
tail -f ~/.pm2/logs/designhub-api-error.log
```

### 3. Set Up Alerts

- Response time > 2s → Alert
- Error rate > 5% → Alert
- Database offline → Alert
- Disk space > 80% → Alert

---

## Scaling in Production

When you need to handle more traffic:

### Horizontal Scaling (Multiple Servers)
1. Set up load balancer (AWS ELB, Render handles automatically)
2. Deploy backend to multiple instances
3. Use managed database (MongoDB Atlas handles scaling)

### Vertical Scaling (Larger Server)
1. Upgrade EC2 instance size
2. Increase database tier (M2, M3, etc.)
3. Monitor metrics before/after

### Database Optimization
1. Add indexes for frequently queried fields
2. Archive old designs (soft delete)
3. Implement caching layer (Redis)

---

## Questions?

Refer to:
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [API Documentation](./backend/API_DOCUMENTATION.md)
- [MongoDB Atlas Docs](https://docs.mongodb.com/atlas/)
- [Render Docs](https://render.com/docs)
