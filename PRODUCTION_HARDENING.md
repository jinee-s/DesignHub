# Production Hardening Checklist

## Overview
Added production-ready security and configuration features to DesignHub backend.

---

## 1. Input Validation Middleware ✅

**File:** `backend/src/middleware/validationMiddleware.js`

**Features:**
- Type validators (String, Email, Number, Boolean, Array)
- Pattern validators (Username, Password, URL)
- Field sanitization (removes dangerous characters)
- Validation schemas for each endpoint
- Clean 400 error responses with field-level error messages

**Usage in Routes:**
```javascript
router.post('/register', authLimiter, validate('register'), register);
router.post('/login', authLimiter, validate('login'), login);
router.post('/image', uploadLimiter, validate('upload'), uploadImage);
```

**Available Validators:**
- `isString()` - Non-empty string
- `isEmail()` - Valid email format
- `isUsername()` - 3-30 alphanumeric characters
- `isPassword()` - 8+ chars with uppercase, lowercase, number
- `isURL()` - Valid URL format
- `sanitize()` - Remove dangerous characters

**Error Response Example:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "Username must be 3-30 characters, alphanumeric only",
    "Password must be 8+ chars with uppercase, lowercase, number"
  ]
}
```

---

## 2. CORS Configuration (Environment-Based) ✅

**Files Modified:**
- `backend/server.js` - Updated CORS logic
- `backend/.env` - New CORS variables
- `backend/.env.example` - Documentation

**Environment Variables:**
```env
# Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:4173

# Allow credentials (cookies, auth headers)
CORS_CREDENTIALS=true
```

**Production Example:**
```env
CORS_ORIGINS=https://designhub.com,https://www.designhub.com,https://app.designhub.com
CORS_CREDENTIALS=true
```

**Behavior:**
- **Development:** All origins allowed (fail-open for local testing)
- **Production:** Only configured origins allowed (fail-closed for security)

**Testing:**
```bash
# Request from allowed origin succeeds
curl -H "Origin: http://localhost:5173" http://localhost:5000/api/health

# Request from disallowed origin fails
curl -H "Origin: http://evil.com" http://localhost:5000/api/health
# CORS error: "Origin http://evil.com not allowed"
```

---

## 3. Rate Limiting (Production Security) ✅

**Files Modified:**
- `backend/src/middleware/rateLimiter.js` - Existing limiters
- `backend/src/routes/authRoutes.js` - Applied authLimiter
- `backend/src/routes/uploadRoutes.js` - Applied uploadLimiter
- `backend/src/routes/commentRoutes.js` - Applied commentLimiter
- `backend/.env` - Rate limit configuration

**Environment Variables:**
```env
# Global rate limit
RATE_LIMIT_WINDOW_MS=900000              # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100             # requests per window

# Auth rate limit (strict for brute force prevention)
AUTH_RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
AUTH_RATE_LIMIT_MAX_REQUESTS=5          # requests per window

# Upload rate limit (prevent resource exhaustion)
UPLOAD_RATE_LIMIT_WINDOW_MS=3600000     # 1 hour
UPLOAD_RATE_LIMIT_MAX_REQUESTS=20       # images per hour

# Comment rate limit (prevent spam)
COMMENT_RATE_LIMIT_WINDOW_MS=3600000    # 1 hour
COMMENT_RATE_LIMIT_MAX_REQUESTS=30      # comments per hour
```

**Applied Limiters:**

| Route | Limiter | Limit | Purpose |
|-------|---------|-------|---------|
| POST /api/auth/register | authLimiter | 5/15min | Prevent account spam |
| POST /api/auth/login | authLimiter | 5/15min | Prevent brute force |
| POST /api/upload/image | uploadLimiter | 20/hr | Prevent resource abuse |
| POST /api/upload/multiple | uploadLimiter | 20/hr | Prevent resource abuse |
| POST /api/designs/:id/comments | commentLimiter | 30/hr | Prevent spam |
| All routes | globalLimiter | 100/15min | General protection |

**429 Too Many Requests Response:**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too many authentication attempts. Please try again after 15 minutes.",
  "retryAfter": "15 minutes"
}
```

**Attack Prevention:**

| Attack Type | Without Limit | With Limit | Blocked By |
|-------------|---------------|-----------|-----------|
| Brute force login (10k passwords) | Success in seconds ❌ | Blocked after 5 attempts ✅ | authLimiter |
| DDoS (100k req/sec) | Server crashes ❌ | Rejected with 429 ✅ | globalLimiter |
| Upload bomb (1000 images) | $500+ bill ❌ | Limited to 20/hr ✅ | uploadLimiter |
| Comment spam (10k/min) | DB flooded ❌ | Limited to 30/hr ✅ | commentLimiter |

---

## 4. Clean Production Error Responses ✅

**Error Handler:** `backend/src/middleware/errorHandler.js`

**Development Response (Full Debug Info):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Cannot find design with ID xyz",
  "error": { ... full error object ... },
  "stack": "Error: Cannot find design...\n  at getDesign (controllers/...)"
}
```

**Production Response (Clean, Secure):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Design not found"
}
```

**Security Features:**
- ✅ No stack traces exposed (prevents code structure leakage)
- ✅ No internal error details (database schema hidden)
- ✅ Generic message for programming errors
- ✅ User-friendly messages for operational errors
- ✅ Proper HTTP status codes

**Error Classification:**

| Category | Example | Status | Message |
|----------|---------|--------|---------|
| Operational | Email already exists | 409 | "Email already registered" |
| Operational | Weak password | 400 | "Password must be 8+ chars with..." |
| Operational | Unauthorized | 401 | "Not authorized, no token" |
| Operational | Rate limited | 429 | "Too many requests, try again later" |
| Programming | Unexpected crash | 500 | "Something went wrong, please try later" |

---

## 5. Development Logs Removed ✅

**Files Cleaned:**
- ✅ `backend/src/services/designService.js` - Removed Cloudinary delete logs
- ✅ `backend/src/middleware/authMiddleware.js` - Removed token verification logs
- ✅ `backend/src/controllers/uploadController.js` - Removed Cloudinary operation logs
- ✅ `backend/src/middleware/uploadMiddleware.js` - Removed delete error logs

**Remaining Logs (Production-Safe):**
- ✅ Server startup logs (port, environment, database status)
- ✅ Environment validation logs (only in startup)
- ✅ Error logs in errorHandler (only in development mode)
- ✅ Health/ready endpoint responses (status checking)

---

## Testing Production Configuration

### Test Input Validation
```bash
# Valid request
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
# Response: 201 Created

# Invalid email
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "invalid-email",
    "password": "SecurePass123"
  }'
# Response: 400 Bad Request
# Message: "Validation failed"
# Errors: ["Invalid email format"]
```

### Test CORS
```bash
# Allowed origin (development)
curl -H "Origin: http://localhost:5173" \
  -I http://localhost:5000/api/health
# Response: 200 OK (with CORS headers)

# Test in browser from http://localhost:5173
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Test Rate Limiting
```bash
# Bash: 10 rapid login attempts
for i in {1..10}; do
  echo "Request $i:"
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done

# Expected:
# Requests 1-5: 401 Unauthorized
# Requests 6-10: 429 Too Many Requests
```

### Test Production Error Response
```bash
# Enable production mode
NODE_ENV=production npm run dev

# Trigger an error
curl http://localhost:5000/api/designs/invalid-id

# Response (clean, no stack trace):
{
  "status": "error",
  "statusCode": 400,
  "message": "Invalid _id: invalid-id. Please provide a valid ID."
}
```

---

## Environment Variable Summary

**Required Variables:**
```env
NODE_ENV=development|production
PORT=5000
MONGO_URI=mongodb://...
JWT_SECRET=...
JWT_EXPIRE=7d
```

**New Security Variables:**
```env
# CORS (allow frontend domains)
CORS_ORIGINS=http://localhost:5173,https://designhub.com
CORS_CREDENTIALS=true

# Rate Limiting (customize per environment)
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

## Deployment Checklist

### Before Production Deploy
- [ ] Set `NODE_ENV=production` in server config
- [ ] Update `CORS_ORIGINS` to your frontend domain(s)
- [ ] Update `JWT_SECRET` to new secure value
- [ ] Set appropriate rate limits (may need tuning)
- [ ] Enable SSL/HTTPS
- [ ] Set up error logging (Sentry, DataDog, etc.)
- [ ] Configure database backups
- [ ] Test all error scenarios with `NODE_ENV=production`

### Production Environment Example
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://prod_user:pwd@cluster.mongodb.net/designhub_prod
JWT_SECRET=<long-secure-value-from-crypto-randomBytes>
JWT_EXPIRE=7d

CORS_ORIGINS=https://designhub.com,https://www.designhub.com,https://api.designhub.com
CORS_CREDENTIALS=true

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
UPLOAD_RATE_LIMIT_MAX_REQUESTS=20
COMMENT_RATE_LIMIT_MAX_REQUESTS=30

CLOUDINARY_CLOUD_NAME=your_account
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

CLIENT_URL=https://designhub.com
LOG_LEVEL=info
```

---

## Security Improvements Summary

| Issue | Before | After | Impact |
|-------|--------|-------|--------|
| CORS | Hardcoded localhost | Environment-configured | ✅ Production-ready |
| Rate Limiting | Only 1 global limit | 5 customizable limits | ✅ Fine-grained protection |
| Input Validation | Minimal (only in models) | Comprehensive middleware | ✅ Early rejection, XSS/injection prevention |
| Error Responses | Stack traces exposed | Clean production responses | ✅ Security through obscurity |
| Dev Logs | Console spam in production | Conditional dev-only logs | ✅ Cleaner production output |

---

## Next Steps (Optional Enhancements)

1. **Advanced Rate Limiting**
   - Use Redis store for multi-server deployments
   - Rate limit by user ID (not just IP)
   - Dynamic limits based on user tier

2. **Request Logging**
   - Add Morgan or Winston for request logging
   - Log to file instead of console
   - Structured logging (JSON format)

3. **Error Tracking**
   - Integrate Sentry for error monitoring
   - Send production errors to dashboard
   - Alert on critical errors

4. **API Versioning**
   - Add /api/v1/ prefix to routes
   - Support multiple API versions simultaneously

5. **API Documentation**
   - Use Swagger/OpenAPI for auto-generated docs
   - Document error codes and responses

6. **Additional Security Headers**
   - CSP (Content Security Policy)
   - X-Powered-By header removal
   - Strict-Transport-Security

---

## Quick Reference

### Start Backend with Production Config
```bash
NODE_ENV=production npm run dev
```

### View Current Rate Limit Status
```bash
# Headers are automatically included
curl -v http://localhost:5000/api/health | grep -i "ratelimit"
# Shows: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
```

### Update CORS in Production
Edit `.env`:
```env
CORS_ORIGINS=https://new-domain.com,https://www.new-domain.com
```
Restart server (automatically picks up new value).

---

**Status:** ✅ All production hardening features implemented and tested
**Last Updated:** February 16, 2026
