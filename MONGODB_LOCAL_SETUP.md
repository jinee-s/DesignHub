# MongoDB Local Setup Guide for DesignHub

**Status:** ✅ Backend configured for local MongoDB at `mongodb://127.0.0.1:27017/designhub`

---

## 🚀 Quick Start (Choose Your OS)

### Windows

#### Option A: Direct Install (Recommended)
```powershell
# 1. Download MongoDB Community Edition
#    Visit: https://www.mongodb.com/try/download/community
#    Choose: Windows MSI Installer
#    Install to: C:\Program Files\MongoDB\Server\7.0\ (or latest version)

# 2. Start MongoDB (AdminCMD)
# Find mongod.exe:
cd "C:\Program Files\MongoDB\Server\7.0\bin"
mongod.exe --dbpath "C:\data\db"

# 3. Keep this window open - MongoDB is now running!
```

#### Option B: Using Docker (No Install Needed)
```powershell
# 1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
# 2. Start MongoDB container:
docker run -d -p 27017:27017 --name mongodb-designhub mongo:latest

# 3. Verify it's running:
docker ps | findstr mongodb

# 4. To stop later:
docker stop mongodb-designhub
docker rm mongodb-designhub
```

---

### Mac

#### Option A: Using Homebrew (Recommended)
```bash
# 1. Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install MongoDB
brew install mongodb-community

# 3. Start MongoDB (runs in background)
brew services start mongodb-community

# 4. Verify it's running:
mongosh  # Opens MongoDB shell
# Type: exit  (to quit shell)

# 5. To stop later:
brew services stop mongodb-community
```

#### Option B: Using Docker
```bash
docker run -d -p 27017:27017 --name mongodb-designhub mongo:latest
docker exec -it mongodb-designhub mongosh  # Open shell to verify
```

---

### Linux (Ubuntu/Debian)

```bash
# 1. Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# 2. Start MongoDB service
sudo systemctl start mongod

# 3. Enable auto-start on boot (optional)
sudo systemctl enable mongod

# 4. Verify it's running:
sudo systemctl status mongod

# 5. To stop later:
sudo systemctl stop mongod
```

---

## ✅ Verify MongoDB Installation

```bash
# Connect to MongoDB shell
mongosh

# In the shell, run:
db.version()  # Should return version number like "7.0.0"

# Exit shell:
exit
```

**Expected Output:**
```
> db.version()
'7.0.0'
```

---

## 🔧 Test Backend Connection

### Step 1: Make sure MongoDB is running
```powershell
# Windows - Check if mongod is running
Get-Process mongod -ErrorAction SilentlyContinue

# If not running, start it:
# mongod.exe --dbpath "C:\data\db"
```

### Step 2: Start Backend Server
```bash
cd D:\Project1\backend
npm install        # (if not already done)
npm run dev        # Starts with nodemon (auto-reload on file changes)
```

**Expected Console Output:**
```
✅ MongoDB Connected: 127.0.0.1
📊 Database: designhub
🔄 Connection Pool: 10 connections

======================================================================
  DESIGNHUB API SERVER STARTED
======================================================================
  🚀 Environment: development
  📡 Port: 5000
  🌐 API Base URL: http://localhost:5000/api
  🏥 Health Check: http://localhost:5000/api/health
  ✅ Readiness Check: http://localhost:5000/api/ready
======================================================================
```

### Step 3: Test Health Endpoint
```powershell
# Open new terminal, run:
Invoke-RestMethod -Uri http://localhost:5000/api/health -Method GET | ConvertTo-Json

# Expected response:
# {
#   "success":  true,
#   "message":  "DesignHub API is running! 🚀",
#   "environment":  "development",
#   "timestamp":  "2026-02-17T15:45:32.123Z"
# }
```

---

## 🧪 Run Backend Tests

```bash
cd D:\Project1\backend

# Unit tests (no DB needed)
npm run test:unit
# Expected: 13/13 passing ✅

# Integration tests (needs MongoDB running AND backend running in another terminal)
npm run test:integration
# Expected: 5/5 passing ✅

# All tests
npm test
```

---

## 🌐 Start Frontend (in another terminal)

```bash
cd D:\Project1\frontend
npm run dev

# Output:
#  VITE v7.3.1  ready in 125 ms
#  ➜  Local:   http://localhost:5173/
#  ➜  Press q to quit
```

Go to: `http://localhost:5173/`

---

## 🔧 Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:27017"
**Cause:** MongoDB is not running  
**Fix:**
```bash
# Windows:
cd "C:\Program Files\MongoDB\Server\7.0\bin"
mongod.exe --dbpath "C:\data\db"

# Mac:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Docker:
docker run -d -p 27017:27017 --name mongodb-designhub mongo:latest
```

### Error: "MongoDB not found" or "mongod not in PATH"
**Cause:** MongoDB not installed correctly  
**Fix:** Re-install MongoDB from https://www.mongodb.com/try/download/community

### Backend won't start
**Check:**
1. MongoDB is running: `mongosh` (should open shell)
2. Port 5000 not in use: `Get-NetTCPConnection -LocalPort 5000`
3. .env file exists: `D:\Project1\backend\.env`
4. MONGO_URI is correct: `mongodb://127.0.0.1:27017/designhub`
5. JWT_SECRET is 32+ chars (our .env has it set correctly)

### "Error: connect EADDRINUSE :::5000"
**Cause:** Port 5000 already in use  
**Fix:**
```powershell
# Kill process on port 5000:
$proc = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($proc) { Stop-Process -Id $proc.OwningProcess -Force }

# Or change port in .env:
PORT=5001  # Use different port
```

---

## 📊 Database Management

### View Database Contents
```bash
# Connect to MongoDB shell:
mongosh

# Use the designhub database:
use designhub

# View all collections:
show collections

# Count users:
db.users.countDocuments()

# View first user:
db.users.findOne()

# Exit:
exit
```

### Reset Database (Remove All Data)
```bash
mongosh

use designhub

# Delete all collections:
db.users.deleteMany({})
db.designs.deleteMany({})
db.comments.deleteMany({})

# Verify empty:
show collections
db.users.countDocuments()  # Should be 0
exit
```

### Backup Database
```bash
# Windows:
"C:\Program Files\MongoDB\Server\7.0\bin\mongodump.exe" --db designhub --out C:\backup_designhub

# Mac/Linux:
mongodump --db designhub --out ./backup_designhub
```

---

## 🚀 Next Steps

Once MongoDB is running and you see the server startup message:

1. **Test the API:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Start Frontend:**
   ```bash
   cd frontend && npm run dev
   ```

3. **Run Tests:**
   ```bash
   cd backend && npm test
   ```

4. **Create Test User (in Browser):**
   - Go to http://localhost:5173/register
   - Fill in form and submit
   - Check backend logs for any errors

---

## 📝 Current Configuration

**File:** `D:\Project1\backend\.env`

```dotenv
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/designhub
JWT_SECRET=dev_designhub_secret_key_local_testing_only_safe
JWT_EXPIRE=7d
```

✅ All values are correctly set for local development!

---

## 🆘 Need More Help?

- **MongoDB Docs:** https://docs.mongodb.com/manual/
- **Connection Issues:** https://docs.mongodb.com/manual/administration/
- **Query Examples:** https://docs.mongodb.com/manual/tutorial/

---

**Last Updated:** February 17, 2026  
**Status:** ✅ Ready for local development
