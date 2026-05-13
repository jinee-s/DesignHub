/**
 * ============================================================================
 * DESIGNHUB BACKEND - PRODUCTION READY SERVER
 * ============================================================================
 * 
 * STARTUP SEQUENCE:
 * 1. Load & validate environment variables (CRITICAL - fails fast if invalid)
 * 2. Connect to MongoDB
 * 3. Initialize Express with security middleware
 * 4. Mount API routes with rate limiting
 * 5. Setup centralized error handling
 * 6. Start server
 * 
 * PRODUCTION FEATURES:
 * - Environment validation (prevents misconfiguration)
 * - Security headers (helmet)
 * - Request sanitization (prevent NoSQL injection, XSS)
 * - Rate limiting (prevent abuse, DDoS)
 * - Centralized error handling (consistent errors)
 * - Custom error classes (proper HTTP status codes)
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import colors from 'colors';
import connectDB from './src/config/db.js';
import { notFoundHandler, errorHandler } from './src/middleware/errorHandler.js';
import { globalLimiter } from './src/middleware/rateLimiter.js';
import { validateEnv } from './src/utils/validateEnv.js';
import authRoutes from './src/routes/authRoutes.js';
import designRoutes from './src/routes/designRoutes.js';
import commentRoutes, { individualCommentRoutes } from './src/routes/commentRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';

// ============================================================================
// 1. LOAD & VALIDATE ENVIRONMENT
// ============================================================================

// Load .env file - MUST be first, before any env var access
dotenv.config();

// Log environment variables for debugging
console.log('🔧 Environment Variables Loaded:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Missing');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || '❌ Missing');
console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');

// Initialize Cloudinary BEFORE validation (needed by uploadMiddleware)
import cloudinary from './src/config/cloudinary.js';

console.log('☁️  Cloudinary:', process.env.CLOUDINARY_CLOUD_NAME || 'Not configured');

// Validate all required environment variables (exits if invalid)
// CRITICAL: Prevents server from starting with missing/invalid config
validateEnv();

// ============================================================================
// 2. CONNECT TO DATABASE & START SERVER
// ============================================================================

// Initialize Express app FIRST (before DB connection)
const app = express();

// Declare server variable for use in error handlers
let server;

// Async startup wrapper - CRITICAL: Must complete before listening
(async () => {
  try {
    // Await MongoDB connection before starting server
    await connectDB();

// ============================================================================
// 3. SECURITY MIDDLEWARE (PRODUCTION CRITICAL)
// ============================================================================

/**
 * HELMET - Security Headers
 * 
 * WHY?
 * Sets HTTP headers to protect against common attacks:
 * - X-Content-Type-Options: nosniff (prevents MIME sniffing)
 * - X-Frame-Options: SAMEORIGIN (prevents clickjacking)
 * - X-XSS-Protection: 1 (enables XSS filter)
 * - Strict-Transport-Security (forces HTTPS)
 * 
 * REAL-WORLD: Used by Facebook, Twitter, GitHub - every major site!
 * 
 * ATTACK PREVENTION:
 * Without helmet: Hacker can embed your site in iframe, steal clicks/data
 * With helmet: Browser blocks embedded iframes, XSS attempts
 */
app.use(helmet());

/**
 * CORS - Cross-Origin Resource Sharing
 * 
 * WHY?
 * Frontend (http://localhost:5173) different origin than backend (http://localhost:5000)
 * Browser blocks cross-origin requests by default (security)
 * 
 * PRODUCTION NOTE:
 * Set CORS_ORIGINS environment variable to your frontend domain(s):
 * - Development: http://localhost:5173,http://localhost:5174,http://localhost:5175
 * - Production: https://designhub.netlify.app,https://api.designhub.com
 * 
 * Comma-separated list in .env: CORS_ORIGINS=http://localhost:5173,https://designhub.com
 */
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:4173').split(',');
const corsCredentials = process.env.CORS_CREDENTIALS === 'true';

if (process.env.NODE_ENV === 'development') {
  // Development: lenient CORS to simplify local testing
  app.use(cors({ 
    origin: true, 
    credentials: corsCredentials 
  }));
} else {
  // Production: strict CORS, only allow configured origins
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, Postman)
      if (!origin) return callback(null, true);
      
      // Trim whitespace from allowed origins
      const trimmedOrigins = corsOrigins.map(o => o.trim());
      
      if (trimmedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Origin not allowed
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`), false);
    },
    credentials: corsCredentials,
  }));
}

/**
 * BODY PARSERS - JSON & URL-encoded
 * 
 * WHY?
 * Express doesn't parse request bodies by default
 * These enable req.body access in controllers
 * 
 * LIMIT: Prevents large payload attacks (DDoS)
 * Without limit: Attacker sends 100MB JSON → server crashes
 * With 10MB limit: Server rejects large payloads
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * MONGO SANITIZE - NoSQL Injection Prevention
 * 
 * WHY?
 * Prevents attackers from injecting MongoDB operators
 * 
 * ATTACK EXAMPLE (Without protection):
 * POST /api/auth/login
 * { "email": {"$gt": ""}, "password": {"$gt": ""} }
 * 
 * This bypasses authentication! Logs in as first user
 * 
 * WITH PROTECTION:
 * Sanitizes request, converts to:
 * { "email": "[object Object]", "password": "[object Object]" }
 * Login fails (as it should) ✅
 * 
 * REAL-WORLD BREACH:
 * MongoDB injection led to: 40M user records stolen from Patreon
 */
app.use(mongoSanitize());

/**
 * XSS-CLEAN - Cross-Site Scripting Prevention
 * 
 * WHY?
 * Sanitizes user input to prevent JavaScript injection
 * 
 * ATTACK EXAMPLE (Without protection):
 * User posts comment: <script>alert(document.cookie)</script>
 * Other users see comment → script steals their cookies!
 * 
 * WITH PROTECTION:
 * Script tags converted to harmless text
 * Displays as: &lt;script&gt;alert(document.cookie)&lt;/script&gt;
 * Browser shows text, doesn't execute script ✅
 * 
 * REAL-WORLD IMPACT:
 * XSS attack on Shopify: Attackers stole admin sessions via injected scripts
 */
app.use(xss());

/**
 * HPP - HTTP Parameter Pollution Prevention
 * 
 * WHY?
 * Prevents duplicate query parameters
 * 
 * ATTACK EXAMPLE (Without protection):
 * GET /api/designs?sort=price&sort=name
 * Server confused, might crash or behave unexpectedly
 * 
 * WITH PROTECTION:
 * Takes last value: sort=name
 * Consistent behavior, no crashes ✅
 */
app.use(hpp());

/**
 * RATE LIMITING - Abuse Prevention
 * 
 * WHY?
 * Limits requests per IP to prevent:
 * - Brute force attacks (password guessing)
 * - DDoS attacks (overwhelming server)
 * - API abuse (scraping, resource exhaustion)
 * 
 * LIMIT: Configured via environment variables
 * - Global: 100 requests per 15 minutes per IP
 * - Auth: 5 requests per 15 minutes (strict for login/register)
 * - Upload: 10 images per hour
 * 
 * REAL-WORLD: Twitter (300 posts/3hrs), GitHub (5000 API calls/hr)
 */
app.use(globalLimiter);

// ============================================================================
// 4. API ROUTES
// ============================================================================

/**
 * Health Check Route
 * WHY? Used by deployment platforms (Render, AWS) to check if server is alive
 * REAL-WORLD: Called "health endpoint" or "ping endpoint"
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DesignHub API is running! 🚀',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness Check Route
 * WHY? Kubernetes uses this to determine if pod is ready for traffic
 * Health = "process is running"
 * Ready = "process is running AND can handle requests (DB connected, etc.)"
 * 
 * DIFFERENCE:
 * /health → Quick check, pod is alive
 * /ready → Deeper check, all dependencies OK (DB, cache, etc.)
 */
app.get('/api/ready', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1; // 1 = connected
  
  if (!dbConnected) {
    return res.status(503).json({
      success: false,
      message: 'Service not ready - database unavailable',
      ready: false,
      database: 'disconnected'
    });
  }

  res.status(200).json({
    success: true,
    message: 'DesignHub API is ready to serve requests',
    ready: true,
    database: 'connected',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

/**
 * API Routes
 * 
 * ORDER MATTERS!
 * Routes are checked in order, first match wins.
 * 
 * CRITICAL: Mount nested comment routes BEFORE design routes
 * to prevent /:id from matching /comments
 */

// Authentication routes (Register, Login, Get Me)
app.use('/api/auth', authRoutes);

// Upload routes (image upload to Cloudinary)
app.use('/api/upload', uploadRoutes);

// Comment routes nested under designs (add, get)
// MUST come BEFORE /api/designs to prevent /:id from matching /comments
app.use('/api/designs/:designId/comments', commentRoutes);

// Design routes (CRUD, like, save, trending)
app.use('/api/designs', designRoutes);

// Comment routes for individual comments (update, delete, like, flag)
app.use('/api/comments', individualCommentRoutes);

// ============================================================================
// 6. ERROR HANDLING (MUST BE LAST)
// ============================================================================

/**
 * Serve built frontend (if present) - enables serving SPA from backend root
 * This is useful for production-like preview: http://localhost:5000/
 */
// project root is parent of backend folder
const projectRoot = path.resolve(process.cwd(), '..');
const distPath = path.join(projectRoot, 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Serve index.html for non-API routes (SPA fallback)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

/**
 * 404 NOT FOUND HANDLER
 * 
 * WHY AFTER ALL ROUTES?
 * If request reaches here, no route matched
 * Creates NotFoundError with proper 404 status
 * 
 * Example: GET /api/invalid → 404 "Route /api/invalid not found"
 */
app.use(notFoundHandler);

/**
 * CENTRALIZED ERROR HANDLER
 * 
 * WHY LAST MIDDLEWARE?
 * Catches ALL errors from entire app:
 * - Custom errors (NotFoundError, BadRequestError, etc.)
 * - MongoDB errors (duplicate key, validation, cast errors)
 * - JWT errors (invalid token, expired token)
 * - Unexpected errors (bugs, crashes)
 * 
 * BENEFITS:
 * ✅ Consistent error format (always JSON)
 * ✅ Proper HTTP status codes (404, 400, 401, 500, etc.)
 * ✅ Security (hides internal errors in production)
 * ✅ Development-friendly (shows stack traces in dev)
 * 
 * FLOW:
 * Controller throws error → Express catches → errorHandler runs → Response sent
 */
app.use(errorHandler);

// ============================================================================
// 7. START SERVER
// ============================================================================

const PORT = process.env.PORT || 5000;

// Start listening AFTER MongoDB connection established
server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70).green);
  console.log('  DESIGNHUB API SERVER STARTED'.green.bold);
  console.log('='.repeat(70).green);
  console.log(`  🚀 Environment: ${process.env.NODE_ENV}`.yellow);
  console.log(`  📡 Port: ${PORT}`.yellow);
  console.log(`  🌐 API Base URL: http://localhost:${PORT}/api`.cyan);
  console.log(`  🏥 Health Check: http://localhost:${PORT}/api/health`.green);
  console.log(`  ✅ Readiness Check: http://localhost:${PORT}/api/ready`.green);
  console.log('='.repeat(70).green + '\n');
});

  } catch (error) {
    // connectDB() calls process.exit(1) on failure, but catch any sync errors
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
})();

// ============================================================================
// 8. GRACEFUL SHUTDOWN HANDLERS
// ============================================================================

/**
 * UNHANDLED PROMISE REJECTION - Async errors not caught
 */
process.on('unhandledRejection', (err) => {
  console.log('\n' + '⚠️  UNHANDLED PROMISE REJECTION'.red.bold);
  console.log('❌ Error:', err.message.red);
  console.log('🛑 Shutting down server gracefully...\n'.red);
  server.close(() => process.exit(1));
});

/**
 * UNCAUGHT EXCEPTION - Synchronous errors not caught
 */
process.on('uncaughtException', (err) => {
  console.log('\n' + '⚠️  UNCAUGHT EXCEPTION'.red.bold);
  console.log('❌ Error:', err.message.red);
  console.log('🛑 Shutting down immediately...\n'.red);
  process.exit(1);
});

/**
 * SIGTERM - Graceful shutdown signal (production)
 */
process.on('SIGTERM', () => {
  console.log('\n📡 SIGTERM received. Shutting down gracefully...'.cyan);
  server.close(() => {
    console.log('✅ Server closed.\n');
    process.exit(0);
  });
});
