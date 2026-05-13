/**
 * ===================================
 * AUTHENTICATION ROUTES
 * ===================================
 * 
 * Defines all authentication-related endpoints.
 * 
 * ROUTES:
 * - POST /api/auth/register - Create new user account
 * - POST /api/auth/login    - Login existing user
 * - GET  /api/auth/me       - Get current user (protected)
 * - PUT  /api/auth/password - Update password (protected)
 */

import express from 'express';
import {
  register,
  login,
  getMe,
  updatePassword
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * ===================================
 * PUBLIC ROUTES (No auth required)
 * ===================================
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * 
 * REQUEST BODY:
 * {
 *   "username": "john_designer",
 *   "email": "john@email.com",
 *   "password": "password123"
 * }
 * 
 * SUCCESS RESPONSE (201 Created):
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "_id": "65a8b3c9e123456789abcde",
 *     "username": "john_designer",
 *     "email": "john@email.com",
 *     "avatar": "https://ui-avatars.com/api/?name=john_designer",
 *     "createdAt": "2024-01-17T10:30:00.000Z"
 *   }
 * }
 * 
 * ERROR RESPONSES:
 * 400 Bad Request - Invalid input (weak password, invalid email)
 * {
 *   "success": false,
 *   "message": "Password must be at least 6 characters long"
 * }
 * 
 * 409 Conflict - Email or username already exists
 * {
 *   "success": false,
 *   "message": "Email already registered. Please use another email or login."
 * }
 */
router.post('/register', authLimiter, validate('register'), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user & get token
 * @access  Public
 * 
 * REQUEST BODY:
 * {
 *   "email": "john@email.com",
 *   "password": "password123"
 * }
 * 
 * SUCCESS RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "_id": "65a8b3c9e123456789abcde",
 *     "username": "john_designer",
 *     "email": "john@email.com",
 *     "avatar": "https://...",
 *     "bio": "Product Designer",
 *     "followersCount": 42,
 *     "followingCount": 18
 *   }
 * }
 * 
 * ERROR RESPONSES:
 * 400 Bad Request - Missing fields
 * {
 *   "success": false,
 *   "message": "Email is required"
 * }
 * 
 * 401 Unauthorized - Wrong credentials
 * {
 *   "success": false,
 *   "message": "Invalid email or password"
 * }
 */
router.post('/login', authLimiter, validate('login'), login);

/**
 * ===================================
 * PROTECTED ROUTES (Auth required)
 * ===================================
 * 
 * All routes below require valid JWT token.
 * Must send token in Authorization header:
 * 
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user's profile
 * @access  Private (requires JWT token)
 * 
 * REQUEST HEADERS:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * SUCCESS RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "user": {
 *     "_id": "65a8b3c9e123456789abcde",
 *     "username": "john_designer",
 *     "email": "john@email.com",
 *     "avatar": "https://...",
 *     "bio": "Product Designer",
 *     "role": "user",
 *     "createdAt": "2024-01-17T10:30:00.000Z"
 *   }
 * }
 * 
 * ERROR RESPONSES:
 * 401 Unauthorized - No token
 * {
 *   "success": false,
 *   "message": "Not authorized, no token"
 * }
 * 
 * 401 Unauthorized - Invalid token
 * {
 *   "success": false,
 *   "message": "Not authorized, token failed"
 * }
 * 
 * 404 Not Found - User deleted
 * {
 *   "success": false,
 *   "message": "User not found"
 * }
 * 
 * WHEN TO USE:
 * - On app load (check if still logged in)
 * - After profile update (get fresh data)
 * - Verify token before sensitive operations
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/auth/password
 * @desc    Update user password
 * @access  Private (requires JWT token)
 * 
 * REQUEST HEADERS:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * REQUEST BODY:
 * {
 *   "currentPassword": "oldpass123",
 *   "newPassword": "newpass456"
 * }
 * 
 * SUCCESS RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Password updated successfully"
 * }
 * 
 * ERROR RESPONSES:
 * 401 Unauthorized - Wrong current password
 * {
 *   "success": false,
 *   "message": "Current password is incorrect"
 * }
 * 
 * 400 Bad Request - Weak new password
 * {
 *   "success": false,
 *   "message": "Password must be at least 6 characters long"
 * }
 * 
 * SECURITY NOTES:
 * ✅ Requires current password (prevents unauthorized changes)
 * ✅ New password validated for strength
 * ✅ Old password hash is replaced (not stored in history)
 * ✅ Token remains valid (no need to re-login)
 * 
 * BEST PRACTICE (Production):
 * - Send email notification when password changes
 * - Invalidate all other sessions (if using refresh tokens)
 * - Log password change event for security audit
 */
router.put('/password', protect, updatePassword);

/**
 * ===================================
 * ROUTE TESTING WITH POSTMAN/CURL
 * ===================================
 * 
 * 1. REGISTER NEW USER
 * ──────────────────────────────────
 * POST http://localhost:5000/api/auth/register
 * Content-Type: application/json
 * 
 * Body:
 * {
 *   "username": "john_designer",
 *   "email": "john@email.com",
 *   "password": "password123"
 * }
 * 
 * Expected: 201 Created with token + user
 * Copy token from response!
 * 
 * 
 * 2. LOGIN EXISTING USER
 * ──────────────────────────────────
 * POST http://localhost:5000/api/auth/login
 * Content-Type: application/json
 * 
 * Body:
 * {
 *   "email": "john@email.com",
 *   "password": "password123"
 * }
 * 
 * Expected: 200 OK with token + user
 * 
 * 
 * 3. GET CURRENT USER (Protected)
 * ──────────────────────────────────
 * GET http://localhost:5000/api/auth/me
 * Authorization: Bearer <paste_token_here>
 * 
 * Expected: 200 OK with user data
 * 
 * 
 * 4. UPDATE PASSWORD (Protected)
 * ──────────────────────────────────
 * PUT http://localhost:5000/api/auth/password
 * Authorization: Bearer <paste_token_here>
 * Content-Type: application/json
 * 
 * Body:
 * {
 *   "currentPassword": "password123",
 *   "newPassword": "newpass456"
 * }
 * 
 * Expected: 200 OK with success message
 * 
 * 
 * 5. TEST INVALID TOKEN
 * ──────────────────────────────────
 * GET http://localhost:5000/api/auth/me
 * Authorization: Bearer invalid_token_here
 * 
 * Expected: 401 Unauthorized
 * 
 * 
 * 6. TEST NO TOKEN
 * ──────────────────────────────────
 * GET http://localhost:5000/api/auth/me
 * (No Authorization header)
 * 
 * Expected: 401 Unauthorized "Not authorized, no token"
 */

/**
 * ===================================
 * FRONTEND INTEGRATION EXAMPLES
 * ===================================
 * 
 * REACT + AXIOS:
 * ──────────────────────────────────
 * 
 * // Register User
 * const register = async (userData) => {
 *   const response = await axios.post('/api/auth/register', userData);
 *   
 *   // Save token to localStorage
 *   localStorage.setItem('token', response.data.token);
 *   
 *   return response.data.user;
 * };
 * 
 * // Login User
 * const login = async (email, password) => {
 *   const response = await axios.post('/api/auth/login', {
 *     email,
 *     password
 *   });
 *   
 *   localStorage.setItem('token', response.data.token);
 *   return response.data.user;
 * };
 * 
 * // Get Current User
 * const getCurrentUser = async () => {
 *   const token = localStorage.getItem('token');
 *   
 *   const config = {
 *     headers: {
 *       Authorization: `Bearer ${token}`
 *     }
 *   };
 *   
 *   const response = await axios.get('/api/auth/me', config);
 *   return response.data.user;
 * };
 * 
 * // Logout (Frontend only - just delete token)
 * const logout = () => {
 *   localStorage.removeItem('token');
 *   window.location.href = '/login';
 * };
 * 
 * // Axios Interceptor (Auto-attach token to all requests)
 * axios.interceptors.request.use(
 *   (config) => {
 *     const token = localStorage.getItem('token');
 *     if (token) {
 *       config.headers.Authorization = `Bearer ${token}`;
 *     }
 *     return config;
 *   },
 *   (error) => Promise.reject(error)
 * );
 * 
 * // Axios Interceptor (Handle 401 - redirect to login)
 * axios.interceptors.response.use(
 *   (response) => response,
 *   (error) => {
 *     if (error.response?.status === 401) {
 *       localStorage.removeItem('token');
 *       window.location.href = '/login';
 *     }
 *     return Promise.reject(error);
 *   }
 * );
 */

/**
 * ===================================
 * CORS SETUP (Already in server.js)
 * ===================================
 * 
 * Backend must allow frontend origin:
 * 
 * import cors from 'cors';
 * 
 * app.use(cors({
 *   origin: process.env.CLIENT_URL, // http://localhost:5173
 *   credentials: true
 * }));
 * 
 * WHY?
 * - Frontend (localhost:5173) and Backend (localhost:5000) are different origins
 * - Browser blocks requests without CORS headers
 * - credentials: true allows cookies (for httpOnly tokens later)
 */

/**
 * ===================================
 * NEXT STEPS (Future Enhancements)
 * ===================================
 * 
 * 1. REFRESH TOKENS
 *    - Short-lived access token (15 min)
 *    - Long-lived refresh token (7 days)
 *    - Refresh flow: Swap refresh for new access token
 * 
 * 2. EMAIL VERIFICATION
 *    - Send verification email on register
 *    - User must click link to activate account
 *    - Add isEmailVerified field to User model
 * 
 * 3. FORGOT PASSWORD
 *    - POST /api/auth/forgot-password (send reset email)
 *    - GET /api/auth/reset-password/:token (verify reset token)
 *    - PUT /api/auth/reset-password/:token (update password)
 * 
 * 4. SOCIAL LOGIN (OAuth)
 *    - Google OAuth
 *    - GitHub OAuth
 *    - Use passport.js or next-auth
 * 
 * 5. TWO-FACTOR AUTHENTICATION (2FA)
 *    - TOTP (Time-based One-Time Password)
 *    - SMS verification
 *    - Use speakeasy package
 * 
 * 6. RATE LIMITING
 *    - Limit login attempts (5 per minute)
 *    - Use express-rate-limit
 * 
 * 7. SESSION MANAGEMENT
 *    - Track active sessions
 *    - Allow user to logout all devices
 *    - Store in Redis
 * 
 * 8. SECURITY HEADERS
 *    - Use helmet.js
 *    - Content Security Policy (CSP)
 *    - HSTS (HTTP Strict Transport Security)
 */

export default router;
