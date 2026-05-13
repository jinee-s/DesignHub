/**
 * ===================================
 * JWT TOKEN GENERATOR
 * ===================================
 * 
 * This utility generates JSON Web Tokens for user authentication.
 * 
 * WHAT IS JWT?
 * JSON Web Token (JWT) is a compact, URL-safe means of representing
 * claims to be transferred between two parties.
 * 
 * WHY JWT?
 * - Stateless (server doesn't store session data)
 * - Scalable (works across multiple servers)
 * - Self-contained (all info in token)
 * - Secure (cryptographically signed)
 * 
 * USED BY: Google, GitHub, Stripe, Auth0
 */

import jwt from 'jsonwebtoken';

/**
 * ===================================
 * JWT STRUCTURE (3 Parts)
 * ===================================
 * 
 * JWT = HEADER.PAYLOAD.SIGNATURE
 * 
 * EXAMPLE TOKEN:
 * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWE4YjNjOWUxMjM0NTY3ODkwYWJjZGUiLCJpYXQiOjE3MDU0MTIzNDQsImV4cCI6MTcwNjAxNzE0NH0.6ZuQyqZH3vXJx8N3K7bQ8m5L2pX9wR4tY1aZ3cD5eF6
 * 
 * PART 1: HEADER (Algorithm & Type)
 * ────────────────────────────────
 * {
 *   "alg": "HS256",    ← HMAC SHA-256 algorithm
 *   "typ": "JWT"       ← Token type
 * }
 * 
 * Base64URL encoded: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 * 
 * 
 * PART 2: PAYLOAD (Claims/Data)
 * ────────────────────────────────
 * {
 *   "userId": "65a8b3c9e123456789abcde",  ← User identifier
 *   "iat": 1705412344,                    ← Issued At (timestamp)
 *   "exp": 1706017144                     ← Expires (7 days later)
 * }
 * 
 * Base64URL encoded: eyJ1c2VySWQiOi...
 * 
 * IMPORTANT: Payload is NOT encrypted, just encoded!
 * Don't put sensitive data (passwords, credit cards) in payload.
 * Anyone can decode it! It's visible at jwt.io
 * 
 * 
 * PART 3: SIGNATURE (Cryptographic Proof)
 * ────────────────────────────────────────
 * SIGNATURE = HMACSHA256(
 *   base64UrlEncode(header) + "." + base64UrlEncode(payload),
 *   SECRET_KEY  ← Only server knows this!
 * )
 * 
 * Result: 6ZuQyqZH3vXJx8N3K7bQ8m5L2pX9wR4tY1aZ3cD5eF6
 * 
 * WHY SIGNATURE MATTERS:
 * - If someone changes payload (e.g., userId: "abc" → "xyz")
 * - Signature becomes invalid (tampering detected!)
 * - Without SECRET_KEY, can't create valid signature
 * 
 * ANALOGY:
 * Token = Passport
 * Header = Passport type (US, UK, etc.)
 * Payload = Your info (name, photo, ID)
 * Signature = Government stamp/seal (proves it's real)
 */

/**
 * ===================================
 * GENERATE JWT TOKEN
 * ===================================
 * 
 * Creates a JWT for authenticated user.
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @return {String} - JWT token
 * 
 * USAGE:
 * const token = generateToken(user._id);
 * res.json({ token, user });
 */
const generateToken = (userId) => {
  /**
   * PAYLOAD (Data inside token)
   * 
   * WHY ONLY userId?
   * ✅ Small token size (faster transmission)
   * ✅ If user updates name/email, token still valid
   * ✅ Query database for fresh data (avoid stale data)
   * 
   * WHY NOT include email, username, role?
   * ❌ If user changes email, old token has wrong email
   * ❌ Larger token size (slower)
   * ❌ Security: More info exposed if token intercepted
   * 
   * BEST PRACTICE:
   * Store ONLY what's needed to identify user (userId)
   * Fetch full user data from DB when needed
   */
  const payload = {
    userId: userId.toString() // Convert ObjectId to string
  };

  /**
   * jwt.sign() - Create Token
   * 
   * PARAMETERS:
   * 1. payload - Data to encode
   * 2. secret - Secret key (from .env)
   * 3. options - Configuration
   * 
   * RETURNS: Complete JWT string
   */
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET, // Secret key (never expose!)
    {
      /**
       * EXPIRATION
       * WHY? Limit damage if token stolen
       * 
       * FORMAT OPTIONS:
       * - "7d"     → 7 days
       * - "24h"    → 24 hours
       * - "60m"    → 60 minutes
       * - "3600"   → 3600 seconds (1 hour)
       * 
       * TRADEOFF:
       * ✅ Longer expiry = Better UX (less re-login)
       * ❌ Longer expiry = Bigger security risk if stolen
       * 
       * INDUSTRY STANDARDS:
       * - Consumer apps: 7-30 days (Gmail, Facebook)
       * - Banking apps: 15-30 minutes (higher security)
       * - Enterprise apps: 8-12 hours (work day)
       * 
       * OUR CHOICE: 7 days (good for portfolio/learning apps)
       */
      expiresIn: process.env.JWT_EXPIRE || '7d',

      /**
       * ISSUER (Optional)
       * WHO created this token
       * Useful for multi-service architecture
       */
      // issuer: 'DesignHub',

      /**
       * AUDIENCE (Optional)
       * WHO this token is for
       * Can verify token is for correct service
       */
      // audience: 'DesignHub-Web'
    }
  );

  return token;
};

export default generateToken;

/**
 * ===================================
 * HOW JWT AUTHENTICATION WORKS (FULL FLOW)
 * ===================================
 * 
 * STEP 1: USER REGISTERS
 * ──────────────────────
 * Client → POST /api/auth/register
 * Body: { email: "john@email.com", password: "pass123" }
 * 
 * Server:
 * 1. Hash password with bcrypt
 * 2. Save user to database
 * 3. Generate JWT: token = generateToken(user._id)
 * 4. Return: { token, user }
 * 
 * Client:
 * 1. Receive token
 * 2. Store in localStorage: localStorage.setItem('token', token)
 * 
 * ──────────────────────
 * STEP 2: USER MAKES AUTHENTICATED REQUEST
 * ──────────────────────
 * Client → GET /api/designs
 * Headers: { Authorization: "Bearer eyJhbGci..." }
 * 
 * Server (authMiddleware):
 * 1. Extract token from header
 * 2. Verify signature with SECRET_KEY
 * 3. Decode payload, get userId
 * 4. Fetch user from database
 * 5. Attach user to req.user
 * 6. Continue to route handler
 * 
 * Route Handler:
 * console.log(req.user); // { _id, email, username, ... }
 * 
 * ──────────────────────
 * STEP 3: TOKEN EXPIRES OR USER LOGS OUT
 * ──────────────────────
 * Expired:
 * - jwt.verify() throws TokenExpiredError
 * - Frontend redirects to login
 * 
 * Logout:
 * - Frontend deletes token: localStorage.removeItem('token')
 * - Server doesn't need to do anything (stateless!)
 */

/**
 * ===================================
 * JWT vs SESSION-BASED AUTH
 * ===================================
 * 
 * SESSION-BASED (Old Way):
 * ────────────────────────
 * Login → Server creates session, stores in Redis/DB
 *      → Returns session ID in cookie
 *      → Client sends cookie with every request
 *      → Server looks up session in Redis/DB
 * 
 * ❌ Problems:
 * - Server must store ALL active sessions (memory intensive)
 * - Doesn't scale across multiple servers (sticky sessions needed)
 * - Database lookup on EVERY request (slow)
 * 
 * 
 * JWT-BASED (Modern Way):
 * ────────────────────────
 * Login → Server creates JWT with userId
 *      → Returns token
 *      → Client stores token (localStorage/cookie)
 *      → Client sends token in Authorization header
 *      → Server verifies signature (no database lookup!)
 * 
 * ✅ Benefits:
 * - Stateless (server doesn't store anything)
 * - Scalable (works across multiple servers)
 * - Fast (no database lookup, just cryptography)
 * - Mobile-friendly (easy to use in apps)
 * 
 * 
 * WHEN TO USE EACH:
 * ────────────────────────
 * JWT:
 * ✅ APIs (RESTful, GraphQL)
 * ✅ Microservices
 * ✅ Mobile apps
 * ✅ Single Page Applications (React, Vue)
 * 
 * Sessions:
 * ✅ Server-rendered apps (PHP, Ruby on Rails)
 * ✅ When you need to revoke tokens instantly
 * ✅ When security is paramount (banking)
 */

/**
 * ===================================
 * SECURITY CONSIDERATIONS
 * ===================================
 * 
 * 1. SECRET KEY STRENGTH
 * ────────────────────────
 * ❌ Bad: JWT_SECRET=mysecret
 * ✅ Good: JWT_SECRET=a3f8d9e2c7b6a1f5e4d3c2b1a0987654321fedcba
 * 
 * Generate strong secret:
 * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 
 * 
 * 2. TOKEN STORAGE (Frontend)
 * ────────────────────────
 * OPTIONS:
 * 
 * A) localStorage (Simple, less secure)
 *    localStorage.setItem('token', token)
 *    ❌ Vulnerable to XSS attacks
 *    ✅ Easy to implement
 *    ✅ Persists across tabs/windows
 * 
 * B) httpOnly Cookies (More secure)
 *    Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict
 *    ✅ Not accessible via JavaScript (XSS protection)
 *    ✅ Automatic with requests
 *    ❌ CSRF attacks possible (use CSRF tokens)
 * 
 * C) sessionStorage (Most secure for SPA)
 *    sessionStorage.setItem('token', token)
 *    ✅ Cleared when tab closes
 *    ❌ Lost on page refresh
 * 
 * OUR CHOICE (MVP): localStorage
 * PRODUCTION: httpOnly cookies + CSRF protection
 * 
 * 
 * 3. TOKEN EXPIRATION
 * ────────────────────────
 * ✅ Short-lived access token (15 min - 1 hour)
 * ✅ Long-lived refresh token (7-30 days)
 * ✅ Refresh flow: Swap refresh token for new access token
 * 
 * OUR MVP: Single token (7 days)
 * PRODUCTION: Access + Refresh token pattern
 * 
 * 
 * 4. HTTPS ONLY
 * ────────────────────────
 * ❌ NEVER send tokens over HTTP (can be intercepted!)
 * ✅ ALWAYS use HTTPS in production
 * 
 * 
 * 5. TOKEN REVOCATION
 * ────────────────────────
 * PROBLEM: JWT can't be invalidated (stateless)
 * 
 * SOLUTIONS:
 * A) Short expiration (15 min)
 * B) Blacklist tokens in Redis
 * C) Version field in user model (increment on logout)
 * D) Use refresh tokens (can revoke on server)
 */

/**
 * ===================================
 * COMMON MISTAKES BEGINNERS MAKE
 * ===================================
 * 
 * 1. ❌ Storing sensitive data in payload
 *    const token = jwt.sign({ password: 'secret123' }, secret)
 *    Problem: Payload is BASE64 encoded, not encrypted!
 *    Anyone can decode and read it.
 *    ✅ Solution: Only store userId
 * 
 * 2. ❌ Not using HTTPS
 *    Problem: Token sent in plain text over HTTP
 *    Attacker on same WiFi can intercept
 *    ✅ Solution: Force HTTPS in production
 * 
 * 3. ❌ Weak secret key
 *    JWT_SECRET=123
 *    Problem: Easy to brute force
 *    ✅ Solution: 32+ character random string
 * 
 * 4. ❌ No expiration
 *    jwt.sign(payload, secret) // No expiresIn!
 *    Problem: Stolen token works forever
 *    ✅ Solution: Always set expiresIn
 * 
 * 5. ❌ Not validating token on every request
 *    Problem: Anyone can send fake token
 *    ✅ Solution: Use authMiddleware on protected routes
 * 
 * 6. ❌ Returning password in user object
 *    res.json({ token, user }) // user has password field!
 *    Problem: Sensitive data exposed
 *    ✅ Solution: Use user.getPublicProfile() or select('-password')
 * 
 * 7. ❌ Hardcoding secret in code
 *    const secret = 'mysecretkey'
 *    Problem: Exposed when pushing to GitHub
 *    ✅ Solution: Use .env file (in .gitignore)
 * 
 * 8. ❌ Same secret for development and production
 *    Problem: Dev token works in production!
 *    ✅ Solution: Different secrets per environment
 */

/**
 * ===================================
 * TESTING JWT (jwt.io)
 * ===================================
 * 
 * Visit: https://jwt.io
 * 
 * 1. Paste your token in "Encoded" section
 * 2. See decoded header and payload
 * 3. Enter your JWT_SECRET in "Verify Signature"
 * 4. If valid, you'll see "Signature Verified"
 * 
 * EXAMPLE:
 * Encoded: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * Decoded Header:
 * {
 *   "alg": "HS256",
 *   "typ": "JWT"
 * }
 * 
 * Decoded Payload:
 * {
 *   "userId": "65a8b3c9e123456789abcde",
 *   "iat": 1705412344,
 *   "exp": 1706017144
 * }
 */
