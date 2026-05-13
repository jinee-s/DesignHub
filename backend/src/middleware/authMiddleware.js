/**
 * ===================================
 * AUTHENTICATION MIDDLEWARE
 * ===================================
 * 
 * Middleware to protect routes that require user authentication.
 * Verifies JWT token and attaches user to request object.
 * 
 * WHAT IS MIDDLEWARE?
 * Functions that run BEFORE your route handler.
 * 
 * FLOW:
 * Request → Middleware 1 → Middleware 2 → Route Handler → Response
 * 
 * EXAMPLE:
 * app.get('/api/designs', authMiddleware, designController);
 *                         ↑ Runs first    ↑ Runs if auth passes
 * 
 * PURPOSE:
 * - Verify user is logged in
 * - Attach user data to request
 * - Block unauthorized requests
 */

import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * ===================================
 * PROTECT ROUTE (Verify JWT)
 * ===================================
 * 
 * Checks if user is authenticated via JWT token.
 * If valid, attaches user to req.user.
 * If invalid, returns 401 Unauthorized.
 * 
 * USAGE:
 * import { protect } from './middleware/authMiddleware.js';
 * 
 * // Public route (no auth needed)
 * app.get('/api/designs', getDesigns);
 * 
 * // Protected route (auth required)
 * app.post('/api/designs', protect, createDesign);
 * 
 * In createDesign controller:
 * console.log(req.user); // { _id, email, username, ... }
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  /**
   * STEP 1: EXTRACT TOKEN FROM HEADER
   * ──────────────────────────────────
   * 
   * TOKEN FORMATS:
   * 
   * OPTION A (Standard - Our approach):
   * Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *                        ↑        ↑
   *                     Prefix    Token
   * 
   * OPTION B (Custom header):
   * Header: x-auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * WHY "Bearer"?
   * - Industry standard (OAuth 2.0)
   * - Indicates "bearer" of this token is authorized
   * - Used by: Google, GitHub, Stripe, Twitter APIs
   */
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      /**
       * EXTRACT TOKEN
       * "Bearer eyJhbG..." → Split by space → Get second part
       */
      token = req.headers.authorization.split(' ')[1];

      /**
       * STEP 2: VERIFY TOKEN
       * ──────────────────────────────────
       * 
       * jwt.verify() does THREE things:
       * 
       * 1. Checks if token is properly formatted (3 parts)
       * 2. Verifies signature with SECRET_KEY
       *    - Recomputes HMAC hash
       *    - Compares with signature in token
       *    - If different → Token tampered!
       * 3. Checks expiration
       *    - If exp < now → Token expired!
       * 
       * RETURNS:
       * Decoded payload: { userId, iat, exp }
       * 
       * THROWS ERROR IF:
       * - Invalid signature (tampered token)
       * - Token expired (exp passed)
       * - Malformed token (not 3 parts)
       * 
       * CRYPTOGRAPHY EXPLANATION:
       * ────────────────────────
       * Server created token with:
       * signature = HMAC( header + payload, SECRET_KEY )
       * 
       * Now verifying:
       * recomputed = HMAC( header + payload, SECRET_KEY )
       * 
       * If recomputed === signature → Valid!
       * If recomputed !== signature → Tampered!
       * 
       * WHY THIS WORKS:
       * Without SECRET_KEY, attacker can't create valid signature
       * Changing payload invalidates signature
       */
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      /**
       * STEP 3: FETCH USER FROM DATABASE
       * ──────────────────────────────────
       * 
       * WHY QUERY DATABASE?
       * - User data might have changed since token created
       * - User might be deleted/banned
       * - Get fresh, up-to-date user info
       * 
       * PERFORMANCE CONCERN:
       * ❌ Database query on EVERY request (slow!)
       * ✅ Solutions:
       *    1. Cache user in Redis (5-15 min TTL)
       *    2. Use connection pooling (Mongoose does this)
       *    3. Select only needed fields (faster)
       * 
       * TRADEOFF:
       * ✅ Fresh data (if user banned, token stops working)
       * ❌ Extra database query (adds ~10-50ms)
       * 
       * ALTERNATIVE (Faster but less secure):
       * Store more in JWT payload, skip DB query
       * Risk: Stale data (user role, email, etc.)
       */
      req.user = await User.findById(decoded.userId).select('-password');

      /**
       * STEP 4: CHECK IF USER EXISTS
       * ──────────────────────────────────
       * 
       * WHY THIS CHECK?
       * Token is valid, but user might be deleted from database.
       * 
       * SCENARIO:
       * 1. User logs in → Gets valid token
       * 2. Admin deletes user from database
       * 3. User tries to access protected route with token
       * 4. Token is still valid (not expired)
       * 5. But user doesn't exist anymore!
       * 
       * Without this check: null.username → Crash!
       * With this check: 401 Unauthorized → Clean error
       */
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      /**
       * STEP 5: CHECK IF USER IS ACTIVE
       * ──────────────────────────────────
       * 
       * WHY?
       * User might be banned/deactivated but still has valid token.
       * 
       * REAL-WORLD:
       * - Twitter: Suspended accounts can't tweet (token invalid)
       * - Facebook: Disabled accounts can't post
       */
      if (!req.user.isActive) {
        res.status(403); // 403 = Forbidden
        throw new Error('Your account has been deactivated');
      }

      /**
       * STEP 6: CONTINUE TO ROUTE HANDLER
       * ──────────────────────────────────
       * 
       * next() passes control to next middleware/route handler
       * 
       * Now in route handler:
       * req.user is available with full user data!
       * 
       * Example:
       * const createDesign = async (req, res) => {
       *   const design = await Design.create({
       *     userId: req.user._id,  ← From authMiddleware!
       *     title: req.body.title
       *   });
       * };
       */
      next();

    } catch (error) {
      /**
       * ERROR HANDLING
       * ──────────────────────────────────
       * 
       * COMMON ERRORS:
       * 
       * 1. JsonWebTokenError
       *    - Invalid token format
       *    - Invalid signature (tampered)
       *    - Malformed token
       * 
       * 2. TokenExpiredError
       *    - Token expired (exp < now)
       * 
       * 3. NotBeforeError (rare)
       *    - Token used before "not before" time (nbf claim)
       * 
       * RESPONSE:
       * 401 = Unauthorized (not authenticated)
       * Message: Hints at what went wrong
       */
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  /**
   * NO TOKEN PROVIDED
   * ──────────────────────────────────
   * 
   * User tried to access protected route without token.
   * 
   * SCENARIOS:
   * - User not logged in
   * - Frontend forgot to send Authorization header
   * - Token in wrong format (not "Bearer <token>")
   * 
   * RESPONSE:
   * 401 Unauthorized with message
   */
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * ===================================
 * ADMIN-ONLY MIDDLEWARE (Optional)
 * ===================================
 * 
 * Additional middleware to check if user is admin.
 * Use AFTER protect middleware.
 * 
 * USAGE:
 * import { protect, admin } from './middleware/authMiddleware.js';
 * 
 * // Protected route (any authenticated user)
 * app.get('/api/designs', protect, getDesigns);
 * 
 * // Admin-only route (must be authenticated + admin)
 * app.delete('/api/users/:id', protect, admin, deleteUser);
 *                              ↑        ↑
 *                          Verify JWT  Check role
 * 
 * FLOW:
 * 1. protect runs → Verifies token → Attaches req.user
 * 2. admin runs → Checks req.user.role === 'admin'
 * 3. Route handler runs (if both pass)
 */
export const admin = asyncHandler(async (req, res, next) => {
  /**
   * CHECK USER ROLE
   * 
   * req.user is set by protect middleware (must run first!)
   * 
   * ROLES (from User model):
   * - 'user'      → Regular user
   * - 'admin'     → Full access
   * - 'moderator' → Limited admin access
   */
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, continue
  } else {
    res.status(403); // 403 = Forbidden (authenticated but no permission)
    throw new Error('Not authorized as admin');
  }
});

/**
 * ===================================
 * OPTIONAL: Moderator Middleware
 * ===================================
 * 
 * Check if user is admin OR moderator.
 * Useful for moderation features (delete comments, ban users).
 */
export const moderator = asyncHandler(async (req, res, next) => {
  if (
    req.user &&
    (req.user.role === 'admin' || req.user.role === 'moderator')
  ) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as moderator');
  }
});

/**
 * ===================================
 * OPTIONAL: Optional Auth Middleware
 * ===================================
 * 
 * Attaches user if token provided, but doesn't require it.
 * Useful for routes that work differently for logged-in users.
 * 
 * EXAMPLE:
 * GET /api/designs
 * - If logged in: Show liked status
 * - If not logged in: Still work, just no liked status
 * 
 * USAGE:
 * app.get('/api/designs', optionalAuth, getDesigns);
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
    } catch (error) {
      // Ignore errors (token invalid but route still works)
      // Token verification failed, continue without user context
    }
  }

  // Always continue (even if no token)
  next();
});

/**
 * ===================================
 * AUTH FLOW VISUALIZATION
 * ===================================
 * 
 * PROTECTED ROUTE FLOW:
 * ────────────────────────────────────
 * 
 * 1. CLIENT REQUEST
 * ──────────────────
 * POST /api/designs
 * Headers: {
 *   Authorization: "Bearer eyJhbGci..."
 * }
 * 
 * 2. SERVER (protect middleware)
 * ──────────────────
 * ✅ Extract token from header
 * ✅ Verify signature with SECRET_KEY
 * ✅ Decode payload → Get userId
 * ✅ Query database → Get user
 * ✅ Attach to req.user
 * ✅ Call next()
 * 
 * 3. ROUTE HANDLER
 * ──────────────────
 * createDesign(req, res) {
 *   console.log(req.user._id); // Available!
 *   // Create design with req.user._id
 * }
 * 
 * 4. RESPONSE
 * ──────────────────
 * { success: true, design: {...} }
 * 
 * 
 * IF TOKEN INVALID:
 * ────────────────────────────────────
 * 
 * 2. SERVER (protect middleware)
 * ──────────────────
 * ❌ jwt.verify() throws error
 * ❌ Catch error
 * ❌ Return 401 Unauthorized
 * ❌ Route handler never runs!
 * 
 * 4. RESPONSE
 * ──────────────────
 * {
 *   success: false,
 *   message: "Not authorized, token failed"
 * }
 */

/**
 * ===================================
 * COMMON MISTAKES
 * ===================================
 * 
 * 1. ❌ Not using protect on sensitive routes
 *    app.post('/api/designs', createDesign); // Anyone can create!
 *    ✅ app.post('/api/designs', protect, createDesign);
 * 
 * 2. ❌ Returning sensitive data
 *    req.user includes password field!
 *    ✅ Use .select('-password') when querying user
 * 
 * 3. ❌ Wrong middleware order
 *    app.delete('/user/:id', admin, protect, deleteUser);
 *    ↑ admin runs first, req.user doesn't exist yet!
 *    ✅ app.delete('/user/:id', protect, admin, deleteUser);
 * 
 * 4. ❌ Not checking if user exists
 *    req.user might be null if user deleted
 *    ✅ if (!req.user) throw error
 * 
 * 5. ❌ Hardcoding role checks in route handler
 *    if (req.user.role !== 'admin') return error; // Repetitive!
 *    ✅ Use admin middleware (DRY principle)
 * 
 * 6. ❌ Using wrong HTTP status codes
 *    return 400 (Bad Request) for unauthorized
 *    ✅ Use 401 (Unauthorized) or 403 (Forbidden)
 *    
 *    401 = Not authenticated (no/invalid token)
 *    403 = Authenticated but no permission (not admin)
 * 
 * 7. ❌ Querying full user object every time
 *    Wastes bandwidth and exposes unnecessary data
 *    ✅ Select only needed fields:
 *    User.findById(id).select('_id username email role')
 */

/**
 * ===================================
 * HTTP STATUS CODES (Auth Context)
 * ===================================
 * 
 * 200 OK
 * - Login successful
 * - Token valid, user data returned
 * 
 * 201 Created
 * - User registered successfully
 * 
 * 400 Bad Request
 * - Invalid email format
 * - Weak password
 * - Missing required fields
 * 
 * 401 Unauthorized
 * - No token provided
 * - Invalid token
 * - Expired token
 * - Wrong credentials (login failed)
 * 
 * 403 Forbidden
 * - Valid token but no permission
 * - Not admin (trying to access admin route)
 * - Account deactivated
 * 
 * 404 Not Found
 * - User not found (token valid but user deleted)
 * 
 * 409 Conflict
 * - Email already exists (registration)
 * - Username already taken
 * 
 * 500 Internal Server Error
 * - Database connection failed
 * - Unexpected error
 */
