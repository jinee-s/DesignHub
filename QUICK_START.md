# 🚀 DESIGNHUB LOCAL SETUP - QUICK REFERENCE

## 5-Minute Quick Start

### Terminal 1: Start MongoDB
```powershell
# Windows - Option A (Direct)
cd "C:\Program Files\MongoDB\Server\7.0\bin"
.\mongod.exe --dbpath "C:\data\db"

# Windows - Option B (Docker)
docker run -d -p 27017:27017 --name mongodb-designhub mongo:latest

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Terminal 2: Start Backend
```bash
cd D:\Project1\backend
npm run dev
```

**Look for:** `✅ MongoDB Connected: 127.0.0.1`

### Terminal 3: Verify Health
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health | ConvertTo-Json
# Should return: "success": true
```

### Terminal 4: Start Frontend
```bash
cd D:\Project1\frontend
npm run dev
# Open: http://localhost:5173/
```

---

## Configuration at a Glance

**File:** `backend/.env`
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/designhub
NODE_ENV=development
JWT_SECRET=dev_designhub_secret_key_local_testing_only_safe
```

✅ All set! No changes needed.

---

## What Was Changed?

1. **`.env`** - JWT_SECRET updated to dev-friendly value (51 chars)
2. **`src/config/db.js`** - Better error messages for MongoDB setup
3. **`MONGODB_LOCAL_SETUP.md`** - Complete setup guide (NEW)
4. **`MONGODB_LOCAL_SETUP_CHECKLIST.md`** - Detailed checklist (NEW)
5. **`verify-mongodb.js`** - Quick verification script (NEW)

---

## Key Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /api/health` | Server alive | `{"success":true}` |
| `GET /api/ready` | DB connected | `{"ready":true}` |
| `POST /auth/register` | Create user | `{"success":true,"token":"..."}` |

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `ECONNREFUSED 127.0.0.1:27017` | Start MongoDB: `mongod.exe --dbpath C:\data\db` |
| `Port 5000 already in use` | Kill process: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess` |
| `Backend won't start` | Check .env exists, MongoDB is running |

---

## Testing

```bash
cd backend

# Unit tests (13 tests)
npm run test:unit

# Integration tests (5 tests)
npm run test:integration

# All tests
npm test

# Verify setup
node ../verify-mongodb.js
```

---

## Next: Production Deployment

See: `DEPLOYMENT_CONFIG.md` for Vercel + Render setup

---

**Last Updated:** Feb 17, 2026 | **Status:** ✅ Ready
