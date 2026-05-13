/**
 * ===================================
 * AUTHENTICATION CONTROLLER
 * ===================================
 * 
 * Handles user authentication operations:
 * - User registration (signup)
 * - User login
 * - Get current user profile
 * 
 * CONTROLLER RESPONSIBILITY:
 * - Receive request data
 * - Validate input
 * - Interact with database (Model)
 * - Return response
 */

import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import {
  validateRegisterData,
  validateLoginData
} from '../utils/validators.js';

/**
 * ===================================
 * REGISTER NEW USER
 * ===================================
 * 
 * @route   POST /api/auth/register
 * @access  Public
 * 
 * BODY:
 * {
 *   "username": "john_designer",
 *   "email": "john@email.com",
 *   "password": "password123",
 *   "role": "designer" or "client" (optional, defaults to 'client')
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "token": "eyJhbGci...",
 *   "user": {
 *     "_id": "65a8b3c9...",
 *     "username": "john_designer",
 *     "email": "john@email.com",
 *     "role": "designer",
 *     "avatar": "https://...",
 *     "createdAt": "2024-01-17T10:30:00.000Z"
 *   }
 * }
 * 
 * FLOW:
 * 1. Validate input (email format, password strength, role)
 * 2. Check if user already exists (email/username)
 * 3. Hash password (bcrypt - automatic in User model)
 * 4. Create user in database with role
 * 5. Generate JWT token
 * 6. Return token + user data
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  /**
   * STEP 1: VALIDATE INPUT
   * ──────────────────────────────────
   * 
   * WHY?
   * - Prevent invalid data from reaching database
   * - Give clear error messages to user
   * - Block malicious input early
   * 
   * CHECKS:
   * ✅ Email format valid
   * ✅ Password meets minimum requirements
   * ✅ Username format valid (alphanumeric + underscore)
   * ✅ Role is valid (designer, client, or admin)
   */
  const validation = validateRegisterData({ username, email, password });

  if (!validation.valid) {
    res.status(400); // 400 = Bad Request
    throw new Error(validation.errors.join(', '));
  }

  // Validate role if provided
  const validRoles = ['designer', 'client', 'admin'];
  if (role && !validRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role. Must be one of: designer, client, admin');
  }

  /**
   * STEP 2: CHECK IF USER EXISTS
   * ──────────────────────────────────
   * 
   * WHY?
   * - Email must be unique (can't have duplicate accounts)
   * - Username must be unique (user-friendly identifier)
   * 
   * SECURITY NOTE:
   * Checking both in one query is faster than two separate queries.
   * 
   * DATABASE QUERY:
   * Find user where email OR username matches
   * (Uses indexes on email and username - fast!)
   */
  const userExists = await User.findOne({
    $or: [
      { email: validation.data.email },
      { username: validation.data.username }
    ]
  });

  if (userExists) {
    res.status(409); // 409 = Conflict
    
    /**
     * GENERIC ERROR (Prevents user enumeration)
     * 
     * ❌ "Email john@email.com already exists"
     *    → Attacker learns john@email.com is registered
     * 
     * ✅ "User with this email or username already exists"
     *    → Doesn't reveal which field matched
     * 
     * HOWEVER, for registration (not login), being specific
     * helps legitimate users. So we can be more specific:
     */
    if (userExists.email === validation.data.email) {
      throw new Error('Email already registered. Please use another email or login.');
    }
    if (userExists.username === validation.data.username) {
      throw new Error('Username already taken. Please choose another username.');
    }
  }

  /**
   * STEP 3: CREATE USER
   * ──────────────────────────────────
   * 
   * WHAT HAPPENS:
   * 1. User.create() calls Mongoose schema
   * 2. Pre-save hook runs (in User model)
   * 3. Password gets hashed with bcrypt
   * 4. User saved to MongoDB
   * 5. Role is set (defaults to 'client' if not provided)
   * 
   * BCRYPT HASHING (Inside User model's pre-save hook):
   * ────────────────────────────────────────────────────
   * 
   * STEP 1: Generate Salt
   * ──────────────────────
   * const salt = await bcrypt.genSalt(10);
   * 
   * SALT = Random string added to password before hashing
   * 
   * WHY SALT?
   * - Prevents rainbow table attacks
   * - Same password hashes differently each time
   * 
   * EXAMPLE:
   * Password: "password123"
   * Salt 1: "$2a$10$aBcDeFgHiJk"
   * Hash 1: "$2a$10$aBcDeFgHiJk...xyz789"
   * 
   * Same password with different salt:
   * Salt 2: "$2a$10$xYzAbC123Wq"
   * Hash 2: "$2a$10$xYzAbC123Wq...def456"
   * 
   * → Same password, different hashes! (Good for security)
   * 
   * COST FACTOR (10 rounds):
   * ────────────────────────
   * bcrypt.genSalt(10) = 2^10 = 1,024 iterations
   * 
   * Each round DOUBLES the time to hash:
   * - 10 rounds ≈ 100ms (Good for web apps)
   * - 12 rounds ≈ 400ms (Slower, more secure)
   * - 14 rounds ≈ 1,600ms (Too slow for web)
   * 
   * TRADEOFF:
   * ✅ Higher rounds = More secure (harder to brute force)
   * ❌ Higher rounds = Slower login/register
   * 
   * INDUSTRY STANDARD: 10-12 rounds
   * 
   * 
   * STEP 2: Hash Password with Salt
   * ──────────────────────
   * const hash = await bcrypt.hash(password, salt);
   * 
   * ALGORITHM: Blowfish cipher (slow by design)
   * 
   * INPUT:
   * - Password: "password123"
   * - Salt: "$2a$10$aBcDeFgHiJk"
   * 
   * OUTPUT (Hash):
   * "$2a$10$aBcDeFgHiJk...xyz789abcdef"
   *  ↑     ↑  ↑              ↑
   *  Alg  Cost Salt      Password Hash
   * 
   * BREAKDOWN:
   * - $2a$ = bcrypt algorithm version
   * - 10 = Cost factor (2^10 iterations)
   * - aBcDeFgHiJk = Salt (22 chars)
   * - xyz789... = Actual password hash (31 chars)
   * 
   * TOTAL LENGTH: 60 characters
   * 
   * 
   * WHY BCRYPT (vs other algorithms)?
   * ──────────────────────────────────
   * 
   * ✅ SLOW by design (prevents brute force)
   *    - MD5: Billions of hashes per second (INSECURE!)
   *    - SHA256: Millions of hashes per second (INSECURE for passwords!)
   *    - bcrypt: Thousands of hashes per second (SECURE!)
   * 
   * ✅ Adaptive (can increase cost factor as computers get faster)
   *    Today: 10 rounds
   *    Future: 12 rounds (same algorithm, just slower)
   * 
   * ✅ Built-in salt (no need to store salt separately)
   * 
   * ✅ Battle-tested (20+ years, widely trusted)
   *    Used by: Google, Microsoft, GitHub, Facebook
   * 
   * ALTERNATIVES:
   * - Argon2 (newer, won password hashing competition 2015)
   * - scrypt (good, but less widely supported)
   * - PBKDF2 (older, NSA recommended, but slower than bcrypt)
   * 
   * 
   * RAINBOW TABLE ATTACK (Why salting matters):
   * ──────────────────────────────────────────────────
   * 
   * WITHOUT SALT:
   * Attacker pre-computes hashes for common passwords:
   * 
   * Rainbow Table:
   * "password" → hash_abc123
   * "123456" → hash_xyz789
   * "qwerty" → hash_def456
   * 
   * If two users have password "password123":
   * User A: hash_abc123
   * User B: hash_abc123  ← SAME HASH!
   * 
   * Attacker sees hash_abc123 in database:
   * → Looks up in rainbow table
   * → Finds password is "password123"
   * → Logs in as BOTH users!
   * 
   * WITH SALT:
   * User A salt: "aBcDeFg"
   * User A password: "password123" + "aBcDeFg" → hash_111
   * 
   * User B salt: "xYzAbCd"
   * User B password: "password123" + "xYzAbCd" → hash_222
   * 
   * → Different hashes! Rainbow table useless!
   * → Attacker must brute force EACH user individually
   */
  const user = await User.create({
    username: validation.data.username,
    email: validation.data.email,
    password: validation.data.password, // Will be hashed by pre-save hook!
    role: role || 'client' // Set role or default to 'client'
  });

  /**
   * STEP 4: GENERATE JWT TOKEN
   * ──────────────────────────────────
   * 
   * Creates JWT with:
   * - Payload: { userId: user._id }
   * - Secret: process.env.JWT_SECRET
   * - Expiration: 7 days
   * 
   * Users get this token and send it with every request.
   */
  const token = generateToken(user._id);

  /**
   * STEP 5: RETURN RESPONSE
   * ──────────────────────────────────
   * 
   * WHY use getPublicProfile()?
   * - Removes password field (even though select: false)
   * - Removes sensitive data (deletedAt, etc.)
   * - Returns clean, safe user object
   * 
   * RESPONSE STRUCTURE:
   * {
   *   success: true,      ← Operation succeeded
   *   token: "eyJhbGc...", ← JWT for authentication
   *   user: {...}         ← User profile data
   * }
   */
  res.status(201).json({ // 201 = Created
    success: true,
    token,
    user: user.getPublicProfile()
  });
});

/**
 * ===================================
 * LOGIN USER
 * ===================================
 * 
 * @route   POST /api/auth/login
 * @access  Public
 * 
 * BODY:
 * {
 *   "email": "john@email.com",
 *   "password": "password123"
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "token": "eyJhbGci...",
 *   "user": { ... }
 * }
 * 
 * FLOW:
 * 1. Validate input
 * 2. Find user by email
 * 3. Compare password hash
 * 4. Generate JWT token
 * 5. Return token + user data
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  /**
   * STEP 1: VALIDATE INPUT
   * ──────────────────────────────────
   */
  const validation = validateLoginData({ email, password });

  if (!validation.valid) {
    res.status(400);
    throw new Error(validation.errors.join(', '));
  }

  /**
   * STEP 2: FIND USER BY EMAIL
   * ──────────────────────────────────
   * 
   * IMPORTANT: .select('+password')
   * 
   * WHY?
   * In User model, password has select: false
   * This means password is EXCLUDED from queries by default
   * 
   * User.findOne({ email }) → { _id, email, username }  (no password!)
   * User.findOne({ email }).select('+password') → { _id, email, password }
   * 
   * WHY select: false?
   * - Security: Prevents accidentally exposing passwords
   * - If you query users, passwords won't be included
   * 
   * WHY +password here?
   * - We NEED password to verify login
   * - Explicitly opt-in to get password field
   */
  const user = await User.findOne({ email: validation.data.email }).select('+password');

  /**
   * STEP 3: VERIFY USER EXISTS & PASSWORD MATCHES
   * ──────────────────────────────────────────────
   * 
   * SECURITY: Generic error message
   * 
   * ❌ Specific errors (reveal info):
   *    if (!user) → "Email not found"
   *    if (!match) → "Wrong password"
   *    → Attacker learns which emails are registered!
   * 
   * ✅ Generic error (no info leak):
   *    "Invalid credentials"
   *    → Attacker doesn't know if email or password is wrong
   * 
   * TIMING ATTACK CONSIDERATION:
   * Advanced protection (not implemented here):
   * - If user not found, still run bcrypt.compare() on dummy hash
   * - Prevents timing attacks (different response times reveal info)
   * - Used in high-security apps (banking, military)
   */
  if (user && (await user.comparePassword(password))) {
    /**
     * PASSWORD COMPARISON (Inside User model):
     * ────────────────────────────────────────
     * 
     * comparePassword method (in User.js):
     * ──────────────────────────────────
     * async comparePassword(enteredPassword) {
     *   return await bcrypt.compare(enteredPassword, this.password);
     * }
     * 
     * bcrypt.compare() PROCESS:
     * ────────────────────────────
     * 
     * INPUT:
     * - enteredPassword: "password123" (plain text from request)
     * - this.password: "$2a$10$aBc...xyz" (hash from database)
     * 
     * STEP 1: Extract salt from stored hash
     * Hash: "$2a$10$aBcDeFgHiJk...xyz789"
     *               ↑ This part is the salt
     * Salt: "$2a$10$aBcDeFgHiJk"
     * 
     * STEP 2: Hash entered password with SAME salt
     * Recompute: bcrypt.hash("password123", "$2a$10$aBcDeFgHiJk")
     * Result: "$2a$10$aBcDeFgHiJk...xyz789"
     * 
     * STEP 3: Compare hashes
     * Stored hash: "$2a$10$aBcDeFgHiJk...xyz789"
     * Computed hash: "$2a$10$aBcDeFgHiJk...xyz789"
     * 
     * If IDENTICAL → Return true (password correct!)
     * If DIFFERENT → Return false (wrong password)
     * 
     * 
     * WHY THIS IS SECURE:
     * ────────────────────────────
     * 
     * ✅ Can't reverse hash to get password
     *    Hash is one-way function
     *    "$2a$10$aBc...xyz" → Can't get "password123"
     * 
     * ✅ Can't compare hashes directly
     *    Must know password to generate matching hash
     * 
     * ✅ Timing is constant
     *    bcrypt.compare() takes ~100ms regardless of match
     *    Prevents timing attacks
     * 
     * 
     * WHAT IF ATTACKER GETS DATABASE?
     * ────────────────────────────────
     * 
     * Attacker has:
     * - Email: john@email.com
     * - Hash: $2a$10$aBcDeFgHiJk...xyz789
     * 
     * OPTION 1: Brute Force (Try every password)
     * ────────────────────────────────
     * Try: "password" → Hash it → Compare
     * Try: "password1" → Hash it → Compare
     * Try: "password123" → Hash it → Compare → MATCH!
     * 
     * PROBLEM FOR ATTACKER:
     * - bcrypt is SLOW (10 rounds = ~100ms per hash)
     * - 100ms × 1 million passwords = 27 hours for one user!
     * - Strong passwords (12+ chars) = years to crack
     * 
     * OPTION 2: Dictionary Attack
     * ────────────────────────────────
     * Pre-made list of common passwords:
     * - "123456", "password", "qwerty", etc.
     * 
     * WHY THIS WORKS:
     * - Most users use weak passwords
     * - Check top 10,000 common passwords first
     * 
     * DEFENSE:
     * ✅ Reject common passwords (we do this in validators.js!)
     * ✅ Enforce minimum length
     * ✅ bcrypt makes it slow (10ms per try even for common ones)
     * 
     * OPTION 3: Rainbow Table (Pre-computed hashes)
     * ────────────────────────────────────────────
     * ❌ DOESN'T WORK with bcrypt!
     * ✅ Salt makes each hash unique
     * ✅ Would need rainbow table for EACH salt (impossible!)
     */
    
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: user.getPublicProfile()
    });
  } else {
    /**
     * INVALID CREDENTIALS
     * ──────────────────────────────────
     * 
     * 401 = Unauthorized
     * Generic message (doesn't reveal if email or password is wrong)
     */
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

/**
 * ===================================
 * GET CURRENT USER (Protected Route)
 * ===================================
 * 
 * @route   GET /api/auth/me
 * @access  Private (Requires auth)
 * 
 * HEADERS:
 * Authorization: Bearer eyJhbGci...
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "user": { ... }
 * }
 * 
 * PURPOSE:
 * - Get current logged-in user's profile
 * - Verify token is still valid
 * - Refresh user data on frontend
 * 
 * WHEN TO USE:
 * - On app load (check if user still logged in)
 * - After updating profile (get fresh data)
 * - Periodically (get latest follower count, etc.)
 * 
 * HOW IT WORKS:
 * 1. protect middleware runs first
 * 2. Verifies JWT token
 * 3. Attaches user to req.user
 * 4. This controller returns req.user
 */
export const getMe = asyncHandler(async (req, res) => {
  /**
   * req.user is set by protect middleware
   * 
   * No need to query database again!
   * protect middleware already did:
   * req.user = await User.findById(userId).select('-password');
   */
  const user = req.user;

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    user: user.getPublicProfile()
  });
});

/**
 * ===================================
 * OPTIONAL: Update Password
 * ===================================
 * 
 * @route   PUT /api/auth/password
 * @access  Private
 * 
 * BODY:
 * {
 *   "currentPassword": "oldpass123",
 *   "newPassword": "newpass456"
 * }
 * 
 * FLOW:
 * 1. Verify current password (security!)
 * 2. Hash new password
 * 3. Save to database
 * 4. Return success
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password field
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  const { validatePassword } = await import('../utils/validators.js');
  const validation = validatePassword(newPassword);

  if (!validation.valid) {
    res.status(400);
    throw new Error(validation.error);
  }

  // Update password (will be hashed by pre-save hook)
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

/**
 * ===================================
 * COMPLETE AUTH FLOW
 * ===================================
 * 
 * DAY 1: USER REGISTERS
 * ────────────────────────────────────
 * 
 * 1. Frontend Form:
 *    Username: john_designer
 *    Email: john@email.com
 *    Password: password123
 * 
 * 2. POST /api/auth/register
 *    Body: { username, email, password }
 * 
 * 3. Backend (This Controller):
 *    ✅ Validate input
 *    ✅ Check if email/username exists
 *    ✅ Hash password (bcrypt 10 rounds, ~100ms)
 *       "password123" → "$2a$10$aBc...xyz789"
 *    ✅ Save to MongoDB
 *    ✅ Generate JWT token
 *    ✅ Return token + user
 * 
 * 4. Frontend Receives:
 *    {
 *      success: true,
 *      token: "eyJhbGci...",
 *      user: { _id, username, email, ... }
 *    }
 * 
 * 5. Frontend Stores Token:
 *    localStorage.setItem('token', token)
 * 
 * 6. User is now logged in!
 * 
 * 
 * DAY 2: USER CREATES DESIGN
 * ────────────────────────────────────
 * 
 * 1. Frontend Request:
 *    POST /api/designs
 *    Headers: {
 *      Authorization: "Bearer eyJhbGci..."
 *    }
 *    Body: { title: "My Design" }
 * 
 * 2. Backend (protect middleware):
 *    ✅ Extract token from Authorization header
 *    ✅ Verify signature with JWT_SECRET
 *    ✅ Decode payload → Get userId
 *    ✅ Query database → Get user
 *    ✅ Attach to req.user
 *    ✅ Call next()
 * 
 * 3. Backend (designController):
 *    const design = await Design.create({
 *      userId: req.user._id,  ← From protect middleware!
 *      title: req.body.title
 *    });
 * 
 * 4. Design created and linked to user!
 * 
 * 
 * DAY 3: TOKEN EXPIRES
 * ────────────────────────────────────
 * 
 * 1. Frontend Request:
 *    GET /api/designs
 *    Headers: { Authorization: "Bearer <expired_token>" }
 * 
 * 2. Backend (protect middleware):
 *    ✅ Extract token
 *    ❌ jwt.verify() throws TokenExpiredError
 *    ❌ Return 401 Unauthorized
 * 
 * 3. Frontend Catches 401:
 *    axios.interceptors.response.use(
 *      response => response,
 *      error => {
 *        if (error.response.status === 401) {
 *          // Token expired, redirect to login
 *          localStorage.removeItem('token');
 *          window.location.href = '/login';
 *        }
 *      }
 *    );
 * 
 * 4. User redirected to login page
 * 
 * 5. User logs in again → Gets new token
 */

/**
 * ===================================
 * SECURITY BEST PRACTICES (Summary)
 * ===================================
 * 
 * 1. PASSWORD HASHING
 *    ✅ bcrypt with 10-12 rounds
 *    ✅ Salt automatically included
 *    ✅ Slow by design (prevents brute force)
 *    ❌ NEVER store plain text passwords
 * 
 * 2. JWT SECURITY
 *    ✅ Strong SECRET_KEY (32+ characters)
 *    ✅ Short expiration (7 days max for learning apps)
 *    ✅ HTTPS only in production
 *    ✅ Store in httpOnly cookies (production)
 *    ❌ Don't store sensitive data in payload
 * 
 * 3. INPUT VALIDATION
 *    ✅ Validate on both frontend and backend
 *    ✅ Sanitize user input (prevent XSS)
 *    ✅ Reject common weak passwords
 *    ✅ Limit input length (prevent DoS)
 * 
 * 4. ERROR MESSAGES
 *    ✅ Generic for login ("Invalid credentials")
 *    ✅ Specific for registration (helps UX)
 *    ❌ Don't reveal if email exists (login)
 * 
 * 5. DATABASE QUERIES
 *    ✅ Use indexes (email, username)
 *    ✅ select('-password') by default
 *    ✅ .select('+password') only when needed
 * 
 * 6. HTTPS
 *    ✅ Force HTTPS in production
 *    ✅ HSTS headers
 *    ❌ NEVER send tokens over HTTP
 * 
 * 7. RATE LIMITING (TODO)
 *    ✅ Limit login attempts (5 per minute)
 *    ✅ Block brute force attacks
 *    ✅ Use express-rate-limit package
 */
