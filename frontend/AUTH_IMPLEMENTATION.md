# Frontend Authentication Implementation Guide

## Overview

This document explains the complete authentication flow, token storage strategy, security considerations, and how the frontend handles authentication for the DesignHub application.

---

## Table of Contents

1. [Authentication Flow (End-to-End)](#authentication-flow-end-to-end)
2. [Token Storage Strategy](#token-storage-strategy)
3. [Security Considerations](#security-considerations)
4. [Implementation Details](#implementation-details)
5. [Common Security Mistakes & How We Avoid Them](#common-security-mistakes--how-we-avoid-them)

---

## Authentication Flow (End-to-End)

### **Part 1: Registration Flow**

```
User (Browser)              Frontend (React)           Backend (Node.js)            Database
    |                            |                            |                        |
    | 1. Fills signup form        |                            |                        |
    |-------- enters ------->     |                            |                        |
    |  username, email,    |      |                            |                        |
    |  password            |      |                            |                        |
    |                            |                            |                        |
    |                    2. Validates frontend                 |                        |
    |                       - username >= 3 chars              |                        |
    |                       - email format valid               |                        |
    |                       - password >= 6 chars              |                        |
    |                       - passwords match                  |                        |
    |                            |                            |                        |
    |                    3. POST /auth/register                |                        |
    |                            |-------------- sends ------->|                        |
    |                            |    { username, email,       |                        |
    |                            |      password }             |                        |
    |                            |                            |                        |
    |                            |                    4. Hash password (bcrypt)       |
    |                            |                       using 10 salt rounds       |
    |                            |                            |                        |
    |                            |                    5. Check email not taken       |
    |                            |                            |                        |
    |                            |                    6. Create user in DB          |
    |                            |                            |----------- save ----->|
    |                            |                            |     User document      |
    |                            |                            |<---------- confirm ----|
    |                            |                            |                        |
    |                    7. Generate JWT token                |                        |
    |                       Header: { alg: 'HS256' }          |                        |
    |                       Payload: { userId, expires }      |                        |
    |                       Sign with secret key              |                        |
    |                            |<-------- send token --------|                        |
    |                            |    { token, user data }    |                        |
    |                            |                            |                        |
    | 8. Receive token in browser |                            |                        |
    |<------ token -------- |                            |                        |
    |                            |                            |                        |
    | 9. Save token to localStorage  |                            |                        |
    |    localStorage.setItem('token', token)                 |                        |
    |                            |                            |                        |
    | 10. Update auth state (AuthContext) |                            |                        |
    |    - set user data                  |                            |                        |
    |    - set isAuthenticated = true     |                            |                        |
    |                            |                            |                        |
    | 11. Redirect to home page  |                            |                        |
    |-------- navigate ----->    |                            |                        |
```

### **Part 2: Login Flow**

```
User (Browser)              Frontend (React)           Backend (Node.js)            Database
    |                            |                            |                        |
    | 1. Enters email + password  |                            |                        |
    |-------- fills ------->     |                            |                        |
    |                            |                            |                        |
    |                    2. Validate inputs                    |                        |
    |                       - email format valid               |                        |
    |                       - password not empty               |                        |
    |                            |                            |                        |
    |                    3. POST /auth/login                   |                        |
    |                            |-------------- sends ------->|                        |
    |                            |    { email, password }      |                        |
    |                            |                            |                        |
    |                            |                    4. Find user by email          |
    |                            |                            |----------- query ----->|
    |                            |                            |<---------- return -----|
    |                            |                            |   User document        |
    |                            |                            |                        |
    |                            |                    5. Compare passwords           |
    |                            |                       bcrypt.compare(            |
    |                            |                         inputPassword,           |
    |                            |                         storedHashedPassword)    |
    |                            |                            |                        |
    |                        [Invalid password?]               |                        |
    |                            |<------ 401 Unauthorized ----|                        |
    |                            |    "Invalid credentials"    |                        |
    |                            |                            |                        |
    |                        [Valid password]                  |                        |
    |                            |                    6. Generate JWT (same as above)|
    |                            |<-------- token + user ------|                        |
    |                            |                            |                        |
    | 7. Frontend receives token  |                            |                        |
    |<---- save & auth ----->    |                            |                        |
    |                            |                            |                        |
```

### **Part 3: Authenticated Requests**

```
After successful login/registration, every API request:

Frontend (React)           Browser/HTTP              Backend (Node.js)
    |                            |                            |
    | 1. Make design API call    |                            |
    |  GET /api/designs          |                            |
    |                            |                            |
    | 2. Axios interceptor:      |                            |
    |    - Read token from       |                            |
    |      localStorage          |                            |
    |    - Add to Authorization  |                            |
    |      header                |                            |
    |                            |                            |
    | Headers: {                 |                            |
    |   "Authorization":         |                            |
    |   "Bearer eyJhbGci..."     |                            |
    | }                          |                            |
    |                            |---- include token ----->   |
    |                            |                            |
    |                            |        3. Middleware verifies token:
    |                            |           - Is token present?
    |                            |           - Is it valid JWT?
    |                            |           - Has it expired?
    |                            |           - Does secret match?
    |                            |
    |                            |        4. Extract userId from token
    |                            |
    |                            |        5. Query user from DB
    |                            |           to get full user object
    |                            |
    |                    6. Process request (user is now authenticated)
    |                            |
    |<------ return data --------|
```

### **Part 4: Logout Flow**

```
User clicks logout:
    1. Frontend calls logout()
    2. Remove token from localStorage
    3. Clear user state from AuthContext
    4. Redirect to /login or /
    5. All API requests now fail (no Authorization header)
    6. Backend middleware rejects requests (401 Unauthorized)
```

---

## Token Storage Strategy

### **Why localStorage?**

```
localStorage.setItem('token', jwtToken);
```

**Pros:**
- ✅ Persists across browser tabs and page refreshes
- ✅ Easy to access for API requests
- ✅ Cross-tab communication (logout in one tab affects all tabs)
- ✅ Simple to implement and understand

**Why NOT cookies?**
- 🚫 More complex for manual JWT injection
- 🚫 CSRF protection adds complexity (requires CSRF tokens)
- 🚫 httpOnly cookies can't be read by JavaScript (but prevents XSS theft)
- 🚫 Requires sameSite & secure attributes

**Why NOT sessionStorage?**
- 🚫 Lost when tab closes (poor UX)
- 🚫 Can't access from other tabs
- 🚫 Not suitable for SPAs with multiple windows

### **What We Store**

```typescript
// In localStorage
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// JWT Structure:
// Header.Payload.Signature

// Header: { alg: 'HS256', typ: 'JWT' }
// Payload (decoded): {
//   userId: "64f7a1b2c3d4e5f6g7h8i9j0",
//   email: "user@example.com",
//   iat: 1708881234,      // Issued at
//   exp: 1708967634       // Expires in 24 hours
// }
// Signature: HMACSHA256(
//   base64(header) + "." + base64(payload),
//   SECRET_KEY
// )
```

### **Token Lifecycle**

```typescript
// 1. After successful login/register:
const response = await authAPI.login({ email, password });
localStorage.setItem('token', response.token);  // ← Store here
setToken(response.token);  // ← Also in React state (faster access)
setUser(response.user);

// 2. On subsequent page loads:
useEffect(() => {
  const savedToken = localStorage.getItem('token');
  if (savedToken) {
    setToken(savedToken);  // ← Restore from localStorage
  }
}, []);

// 3. For every API call:
// Axios interceptor automatically:
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // ← Include in request
  }
  return config;
});

// 4. On logout:
localStorage.removeItem('token');  // ← Delete from localStorage
setToken(null);  // ← Clear React state
```

---

## Security Considerations

### **1. Password Security**

#### ✅ **What We Do (Backend)**
```javascript
// Backend (Node.js):
const hashedPassword = await bcrypt.hash(password, 10);
// 10 rounds = ~100ms to hash one password
// Prevents rainbow tables and GPU attacks
```

#### ❌ **What We DON'T Do**
```javascript
// WRONG - Never do this!
db.users.save({ password: plainTextPassword });  // INSECURE!
const hash = sha1(password);  // SHA1 is too fast to hash
const hash = md5(password);   // MD5 is too fast to hash
```

### **2. Token Security**

#### ✅ **What We Do**
```typescript
// Token expires in 24 hours
exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)

// Token is signed with secret key
jwt.sign(payload, process.env.JWT_SECRET)

// Always send over HTTPS (production)
// Never log tokens in console/error messages
// Never send tokens in URL parameters
```

#### ❌ **What We DON'T Do**
```typescript
// WRONG - Token never expires
jwt.sign(payload, secret);  // No exp field

// WRONG - Token has sensitive data
jwt.sign({ userId, email, password }, secret);  // Password should NEVER be in JWT

// WRONG - Weak secret
process.env.JWT_SECRET = "secret";  // Too simple!

// WRONG - Token in URL
window.location = `/dashboard?token=${jwtToken}`;  // EXPOSED in browser history & logs
```

### **3. XSS (Cross-Site Scripting) Protection**

#### ✅ **What We Do**
```typescript
// React automatically escapes all text content:
<h1>{userInput}</h1>  // Safe - user input is escaped

// Never use dangerouslySetInnerHTML:
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // ← NEVER!
```

#### ❌ **What We DON'T Do**
```typescript
// WRONG - Escaped output
<div innerHTML={userInput}>  // JavaScript object injection
```

### **4. CSRF (Cross-Site Request Forgery) Protection**

#### ✅ **What We Do (Backend)**
```javascript
// Backend validates Origin header
if (req.headers.origin !== 'https://designhub.com') {
  return res.status(403).send('CSRF rejected');
}

// Or use CSRF tokens for forms
const csrfToken = req.csrfToken();
// Require token in POST/PUT/DELETE requests
```

#### Why We're Safe:
- localStorage tokens are NOT automatically sent (unlike cookies)
- Only JavaScript can access and attach the token
- If attacker steals token, they can make requests, but user needs to have visited attacker's site while logged in

### **5. Secure HTTP Headers (Backend)**

```javascript
// Backend should set these headers:
res.setHeader('X-Content-Type-Options', 'nosniff');  // Prevent MIME sniffing
res.setHeader('X-Frame-Options', 'DENY');  // Prevent clickjacking  
res.setHeader('X-XSS-Protection', '1; mode=block');  // Legacy XSS protection
res.setHeader('Strict-Transport-Security', 'max-age=31536000');  // Force HTTPS
res.setHeader('Content-Security-Policy', "default-src 'self'");  // Restrict resource loading
```

---

## Implementation Details

### **AuthContext Structure**

```typescript
// File: src/context/AuthContext.tsx

interface AuthContextType {
  user: User | null;              // Currently logged-in user
  token: string | null;            // JWT token
  isLoading: boolean;              // Loading state during init
  isAuthenticated: boolean;        // !!user (convenience flag)
  login: (email, password) => Promise<void>;      // Login function
  register: (username, email, password) => Promise<void>;  // Register function
  logout: () => void;              // Clear auth state
}

// Usage anywhere in app:
const { user, isAuthenticated, login, register, logout } = useAuth();
```

### **Protected Routes**

```typescript
// File: src/App.tsx

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <Loading variant="fullscreen" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

// Usage in routes:
<Route path="/upload" element={
  <ProtectedRoute>
    <UploadPage />
  </ProtectedRoute>
} />
```

### **API Request Interceptor**

```typescript
// File: src/api/client.ts

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: Add token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 (expired token)
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
);
```

---

## Common Security Mistakes & How We Avoid Them

### **❌ Mistake #1: Storing Password in localStorage**

```typescript
// WRONG:
localStorage.setItem('password', userPassword);  // NEVER!
localStorage.setItem('user', JSON.stringify({ ...user, password }));  // NEVER!

// ✅ CORRECT:
localStorage.setItem('token', jwtToken);  // Only store the token
// Token is stateless, server doesn't need to remember anything
```

**Why it's bad:** localStorage can be accessed by any JavaScript code (including malicious extensions).

---

### **❌ Mistake #2: Trusting Client-Side Validation Only**

```typescript
// WRONG:
if (password.length > 6) {  // Frontend only
  makeLoginRequest();
}

// ✅ CORRECT:
// Frontend validates for good UX:
if (password.length < 6) {
  setError('Password must be at least 6 characters');
  return;
}

// BUT backend also validates:
// Node.js middleware checks password strength AGAIN
// because frontend code can be bypassed!
```

**Why it's bad:** Malicious users can send requests directly to backend, bypassing frontend checks.

---

### **❌ Mistake #3: Storing Tokens in Global Variables**

```typescript
// WRONG:
window.authToken = jwtToken;  // Anyone can access this
globalThis.token = jwtToken;  // EXPOSED!

// ✅ CORRECT:
localStorage.setItem('token', jwtToken);  // Persists across reloads
// Use useAuth() hook to access in components
const { token } = useAuth();  // React state, scoped access
```

**Why it's bad:** Global variables are reset on page reload and visible in console.

---

### **❌ Mistake #4: Logging Sensitive Data**

```typescript
// WRONG:
console.log('Login token:', token);  // Visible in browser console & logs
console.error('Auth error:', { email, password });  // Password in error logs!

// ✅ CORRECT:
console.error('Auth error: Login failed');  // Generic message
// In production, send error logs to secure service
```

**Why it's bad:** Browser console is accessible, logs end up in servers/files.

---

### **❌ Mistake #5: Not Validating JWT Expiration**

```typescript
// WRONG:
const isLoggedIn = !!localStorage.getItem('token');  // Only checks presence!
// Token could be expired, signature invalid, etc.

// ✅ CORRECT:
// Backend always verifies:
jwt.verify(token, secret);  // Throws if expired or invalid
// Frontend silently fails on 401:
axios.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    // Token expired
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
});
```

**Why it's bad:** Expired tokens can be used to access data indefinitely.

---

### **❌ Mistake #6: Sending Token in URL or Unencrypted**

```typescript
// WRONG:
window.location = `/dashboard?token=${jwtToken}`;  // Token in URL!
// Visible in:
// - Browser history
// - Server logs
// - Browser autocomplete
// - Referer headers sent to other sites

// Sending over HTTP:
http://example.com/login?token=xyz  // Not encrypted!

// ✅ CORRECT:
// Store in localStorage (secure storage)
localStorage.setItem('token', jwtToken);
// Always use HTTPS (encrypted)
https://example.com/login
```

**Why it's bad:** URLs are logged everywhere. HTTPS encrypts credentials.

---

### **❌ Mistake #7: Same Token for Years**

```typescript
// WRONG:
jwt.sign(userId, secret);  // No expiration!
// If token is stolen, attacker has permanent access

// ✅ CORRECT:
jwt.sign(
  { userId },
  secret,
  { expiresIn: '24h' }  // Token expires in 24 hours
);

// For long-lived sessions, implement refresh tokens:
// 1. Issue short-lived access token (expires in 15 minutes)
// 2. Issue long-lived refresh token (expires in 30 days)
// 3. When access token expires, use refresh token to get new one
// 4. Only refresh token needs secure storage (httpOnly cookie)
```

**Why it's bad:** Stolen tokens give permanent access to account.

---

### **❌ Mistake #8: Weak JWT Secret**

```typescript
// WRONG:
const JWT_SECRET = 'secret';  // 6 characters!
const JWT_SECRET = '123456';  // Only numbers!
const JWT_SECRET = 'password';  // Common word!
// All can be cracked in milliseconds

// ✅ CORRECT:
// Use strong random secret (32+ characters):
const JWT_SECRET = process.env.JWT_SECRET;  // From environment variable
// Example strong secret:
// 'x7$k9@mP2wQz$vL4&jH8#nR1$tY5%gF9&dB3@cV6!'
```

**Why it's bad:** Weak secrets can be brute-forced, allowing token forgery.

---

### **❌ Mistake #9: Not Using HTTPS**

```javascript
// WRONG (Production):
app.listen(5000);  // HTTP only!
// Token sent in plain text over network
// Anyone on WiFi can intercept it

// ✅ CORRECT:
// In production, always use HTTPS
// Nginx/Apache with SSL certificate
// Or use Node.js HTTPS module:
const https = require('https');
const fs = require('fs');
https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app).listen(443);
```

**Why it's bad:** HTTPS encrypts data in transit. HTTP sends credentials in plain text.

---

### **❌ Mistake #10: Trusting User ID from Client**

```typescript
// WRONG:
async getMyDesigns(req, res) {
  const userId = req.body.userId;  // Client sent this!
  // Attacker can change to another user's ID
  const designs = await Design.find({ userId });
  res.json(designs);
}

// ✅ CORRECT:
async getMyDesigns(req, res) {
  // Extract userId from verified JWT token (server-side)
  const userId = req.user.id;  // From JWT middleware
  // Now we KNOW this user owns this ID
  const designs = await Design.find({ userId });
  res.json(designs);
}
```

**Why it's bad:** Clients can forge user IDs to access other users' data.

---

## Testing the Auth System

### **Test Login Flow**

```bash
# 1. Visit http://localhost:5173/login
# 2. Enter credentials:
#    Email: user@example.com
#    Password: password123
# 3. Click "Login"
# 4. Check localStorage in DevTools:
#    - localStorage.token should be populated with JWT
# 5. Should redirect to home page
# 6. Header should show user's avatar/name instead of Login button
```

### **Test Signup Flow**

```bash
# 1. Visit http://localhost:5173/register
# 2. Fill in form:
#    Username: johndoe (min 3 chars)
#    Email: newemail@example.com
#    Password: Password123 (min 6 chars)
#    Confirm: Password123
# 3. Click "Sign Up"
# 4. Should redirect to home
# 5. Header should show logged-in state
```

### **Test Protected Routes**

```bash
# 1. Logout (or open new private window)
# 2. Visit http://localhost:5173/upload directly
# 3. Should redirect to /login (not allow access)
# 4. Login first, then /upload works
```

### **Test Token Expiration**

```bash
# 1. Login successfully
# 2. In DevTools console:
#    localStorage.setItem('token', 'invalid_token_xyz');
# 3. Try to fetch designs API
# 4. Should get 401 error and redirect to login
```

---

## Best Practices Summary

| ✅ DO | ❌ DON'T |
|------|---------|
| Use HTTPS always | Send tokens in URLs |
| Hash passwords (bcrypt) | Store plain text passwords |
| Expire tokens (24h) | Create tokens that never expire |
| Validate on backend | Trust client-side checks only |
| Use strong JWT secrets | Use weak or simple secrets |
| Store tokens in localStorage | Store passwords anywhere |
| Validate token expiration | Assume token validity |
| Use encrypted connections HTTPS | Use unencrypted HTTP |
| Implement 401 redirect | Ignore failed auth requests |
| Add security headers | Rely on frontend only |

---

## Setup Completed

✅ **Login Page:** [http://localhost:5173/login](http://localhost:5173/login)
✅ **Register Page:** [http://localhost:5173/register](http://localhost:5173/register)
✅ **Protected Routes:** UploadPage, ProfilePage require authentication
✅ **Token Storage:** JWT stored securely in localStorage
✅ **API Interceptors:** Automatically attach token to requests
✅ **Error Handling:** 401 redirects to login
✅ **Responsive:** Mobile-friendly form layouts

---

## Next Steps

1. Test login/signup at localhost:5173
2. Implement design grid on home page (requires backend API)
3. Build upload page with image upload
4. Add profile page with user designs
5. Implement refresh token rotation (advanced)

---

**Questions?** Check the code:
- `src/pages/LoginPage.tsx` - Login form implementation
- `src/pages/RegisterPage.tsx` - Signup form implementation
- `src/context/AuthContext.tsx` - Auth state management
- `src/api/auth.ts` - Auth API endpoints
- `src/api/client.ts` - Request/response interceptors
