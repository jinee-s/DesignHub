/**
 * ============================================================================
 * RATE LIMITING - PRODUCTION SECURITY
 * ============================================================================
 * 
 * WHY RATE LIMITING?
 * -----------------
 * 
 * PROBLEM WITHOUT RATE LIMITING:
 * ------------------------------
 * 1. Brute Force Attacks:
 *    Hacker tries 1,000,000 passwords in 1 second
 *    POST /api/auth/login (with different passwords each time)
 *    Eventually finds correct password ❌
 * 
 * 2. DDoS (Denial of Service) Attacks:
 *    Attacker sends 100,000 requests/second
 *    Server crashes (out of memory, CPU maxed) ❌
 *    Real users can't access site
 * 
 * 3. API Abuse / Scraping:
 *    Bot downloads all designs (GET /api/designs) 1000 times/second
 *    Steals entire database ❌
 *    Server bandwidth exhausted
 * 
 * 4. Resource Exhaustion:
 *    User uploads 100 images/second
 *    Cloudinary bill = $10,000/month ❌
 *    Database filled with junk
 * 
 * SOLUTION WITH RATE LIMITING:
 * ----------------------------
 * Allow only X requests per time window
 * 
 * Examples:
 * - Login: 5 attempts per 15 minutes
 * - Register: 3 accounts per hour
 * - Upload: 10 images per minute
 * - API: 100 requests per hour
 * 
 * If exceeded: 429 Too Many Requests
 * 
 * REAL-WORLD USAGE:
 * ----------------
 * - Twitter: 300 posts per 3 hours
 * - GitHub: 5,000 API requests per hour
 * - Stripe: 100 requests per second
 * - Instagram: 200 likes per hour
 * - All major APIs use rate limiting!
 * 
 * HOW IT WORKS:
 * ------------
 * 1. Store request count per IP address in memory
 * 2. Each request increments counter
 * 3. When limit exceeded, return 429 error
 * 4. Counter resets after time window
 * 
 * Example (5 requests per minute):
 * Request 1 (9:00:00) → Count: 1/5 ✅ Allowed
 * Request 2 (9:00:10) → Count: 2/5 ✅ Allowed
 * Request 3 (9:00:20) → Count: 3/5 ✅ Allowed
 * Request 4 (9:00:30) → Count: 4/5 ✅ Allowed
 * Request 5 (9:00:40) → Count: 5/5 ✅ Allowed
 * Request 6 (9:00:50) → Count: 6/5 ❌ Blocked (429 error)
 * Request 7 (9:01:01) → Count: 1/5 ✅ Allowed (window reset)
 */

import rateLimit from 'express-rate-limit';

/**
 * GENERAL API RATE LIMITER
 * 
 * Applies to ALL routes (prevents general abuse)
 * 
 * Limit: 100 requests per 15 minutes per IP
 * 
 * USE CASE:
 * - Prevent API scraping/abuse
 * - Limit resource usage
 * - Protect against mild attacks
 * 
 * WHY 100 REQUESTS?
 * - Normal user: ~10-20 requests per page load
 * - 100 requests = browse 5-10 pages
 * - Legitimate users won't hit this
 * - Bots/scrapers will hit it quickly
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (in milliseconds)
  max: 100, // Max 100 requests per window
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Send rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  
  /**
   * RESPONSE HEADERS (automatically added):
   * 
   * RateLimit-Limit: 100          (max requests allowed)
   * RateLimit-Remaining: 95       (requests left)
   * RateLimit-Reset: 1739295600   (timestamp when limit resets)
   * Retry-After: 900              (seconds until reset)
   * 
   * Frontend can use these to show:
   * "You have 95 requests remaining. Limit resets in 15 minutes."
   */
  
  // Handler function when limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * AUTH RATE LIMITER (STRICT)
 * 
 * For login/register routes (prevent brute force)
 * 
 * Limit: 5 requests per 15 minutes per IP
 * 
 * USE CASE:
 * - Prevent password guessing
 * - Prevent account spam creation
 * - Protect against credential stuffing
 * 
 * WHY ONLY 5 REQUESTS?
 * - Normal user logs in once, maybe fails 1-2 times
 * - 5 attempts is generous
 * - Brute force needs thousands of attempts
 * 
 * REAL-WORLD ATTACK:
 * Hacker has list of 10,000 common passwords
 * Without limit: tries all 10,000 in 10 seconds ❌
 * With limit: tries 5, blocked for 15 minutes ✅
 * Needs: 10,000 / 5 = 2,000 windows × 15 min = 21 days to try all!
 * 
 * ADDITIONAL SECURITY:
 * Could add:
 * - Account lockout (after X failed logins, lock account)
 * - CAPTCHA (after 3 failures, show CAPTCHA)
 * - IP blacklist (ban repeated attackers)
 * - 2FA (two-factor authentication)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 requests per window
  skipSuccessfulRequests: true, // Don't count successful logins (only failed attempts)
  message: {
    status: 'error',
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      retryAfter: '15 minutes',
      tip: 'If you forgot your password, use the password reset feature.'
    });
  }
});

/**
 * UPLOAD RATE LIMITER
 * 
 * For image/file uploads (prevent resource abuse)
 * 
 * Limit: 20 uploads per hour per IP
 * 
 * USE CASE:
 * - Prevent Cloudinary bill explosion
 * - Prevent storage abuse
 * - Prevent spam uploads
 * 
 * WHY 20 UPLOADS?
 * - Normal user uploads 1-5 designs per session
 * - 20 is generous for legitimate use
 * - Prevents bot from uploading 1000 images
 * 
 * COST PROTECTION:
 * Cloudinary free tier: 25GB storage, 25GB bandwidth
 * If each image = 5MB:
 *   Without limit: Bot uploads 1000 images = 5GB in 1 hour ❌
 *   With limit: Max 20 images = 100MB per hour ✅
 * 
 * One bot could exhaust:
 * - Entire Cloudinary quota in 5 hours
 * - $500/month bill if quota exceeded
 * 
 * Rate limiting saves money!
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 uploads per hour
  message: {
    status: 'error',
    message: 'Upload limit exceeded. Please wait before uploading more images.'
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Upload limit exceeded. You can upload up to 20 images per hour.',
      retryAfter: '1 hour',
      tip: 'Consider uploading images in batches.'
    });
  }
});

/**
 * COMMENT/POST RATE LIMITER
 * 
 * For user-generated content (prevent spam)
 * 
 * Limit: 30 comments/posts per hour per IP
 * 
 * USE CASE:
 * - Prevent comment spam
 * - Prevent bot posting
 * - Maintain content quality
 * 
 * WHY 30 COMMENTS?
 * - Active user might comment 5-10 times (normal)
 * - 30 allows engaged discussion
 * - Bot spammers post 100+ per minute (blocked)
 * 
 * SPAM EXAMPLE:
 * Without limit:
 * Bot posts "Buy cheap products at example.com" 1000 times ❌
 * Database filled with spam
 * Real users leave (poor experience)
 * 
 * With limit:
 * Bot blocked after 30 posts ✅
 * Spam minimized
 * Quality maintained
 */
const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Max 30 comments per hour
  message: {
    status: 'error',
    message: 'Comment limit exceeded. Please wait before posting more comments.'
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'You are posting comments too quickly. Please slow down.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * PASSWORD RESET LIMITER (VERY STRICT)
 * 
 * For password reset requests (prevent email bombing)
 * 
 * Limit: 3 requests per hour per IP
 * 
 * USE CASE:
 * - Prevent email spam
 * - Prevent targetted harassment
 * - Protect email service quotas
 * 
 * WHY ONLY 3 REQUESTS?
 * - User forgets password once (needs 1 request)
 * - Maybe doesn't receive email (tries 2 more times)
 * - 3 is more than enough
 * 
 * EMAIL BOMBING ATTACK:
 * Without limit:
 * Attacker requests password reset 1000 times for victim's email
 * Victim receives 1000 password reset emails ❌
 * Email provider marks emails as spam
 * Victim's inbox flooded
 * 
 * With limit:
 * Only 3 emails sent per hour ✅
 * Attack ineffective
 * Email provider happy
 * 
 * ADDITIONAL PROTECTION:
 * Could add:
 * - Rate limit per email (not just IP)
 * - Require CAPTCHA after 1st request
 * - Cooldown (must wait 5 minutes between requests)
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 requests per hour
  message: {
    status: 'error',
    message: 'Too many password reset requests. Please try again later.'
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many password reset requests from this IP. Please try again in 1 hour.',
      retryAfter: '1 hour',
      tip: 'Check your spam folder for previous reset emails.'
    });
  }
});

/**
 * ============================================================================
 * USAGE IN ROUTES
 * ============================================================================
 * 
 * // Apply to entire app (all routes)
 * app.use(globalLimiter);
 * 
 * // Apply to specific routes
 * app.post('/api/auth/login', authLimiter, loginController);
 * app.post('/api/auth/register', authLimiter, registerController);
 * app.post('/api/upload/image', uploadLimiter, uploadController);
 * app.post('/api/comments', commentLimiter, createCommentController);
 * app.post('/api/auth/reset-password', passwordResetLimiter, resetPasswordController);
 */

/**
 * ============================================================================
 * ADVANCED RATE LIMITING (Optional)
 * ============================================================================
 * 
 * PRODUCTION ENHANCEMENTS:
 * 
 * 1. REDIS STORE (for multiple servers):
 *    Instead of in-memory store, use Redis
 *    Why? In-memory only works with 1 server
 *    If you have 3 servers, each tracks separately (limit × 3)
 *    Redis shares rate limit across all servers
 * 
 *    const RedisStore = require('rate-limit-redis');
 *    const redisClient = require('./config/redis');
 *    
 *    const limiter = rateLimit({
 *      store: new RedisStore({ client: redisClient }),
 *      windowMs: 15 * 60 * 1000,
 *      max: 100
 *    });
 * 
 * 2. RATE LIMIT BY USER (not just IP):
 *    keyGenerator: (req) => req.user?.id || req.ip
 *    
 *    Why? Logged-in users tracked by ID
 *    Prevents multiple IPs bypassing limit (VPN switching)
 * 
 * 3. DYNAMIC LIMITS (based on user type):
 *    const getDynamicMax = (req) => {
 *      if (req.user?.isPremium) return 1000; // Premium users get more
 *      if (req.user) return 100; // Logged-in users
 *      return 50; // Anonymous users (strictest)
 *    };
 *    
 *    const limiter = rateLimit({
 *      max: getDynamicMax,
 *      windowMs: 60 * 60 * 1000
 *    });
 * 
 * 4. WHITELIST (skip rate limiting for trusted IPs):
 *    skip: (req) => {
 *      const trustedIPs = ['192.168.1.1', '10.0.0.1'];
 *      return trustedIPs.includes(req.ip);
 *    }
 * 
 * 5. CUSTOM ERRORS:
 *    handler: (req, res) => {
 *      throw new RateLimitError('Slow down!');
 *    }
 */

/**
 * ============================================================================
 * TESTING RATE LIMITS
 * ============================================================================
 * 
 * Test with curl (make multiple requests quickly):
 * 
 * # Bash loop (Linux/Mac)
 * for i in {1..10}; do
 *   curl -X POST http://localhost:5000/api/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"test@test.com","password":"wrong"}';
 *   echo "\nRequest $i";
 * done
 * 
 * # PowerShell loop (Windows)
 * 1..10 | ForEach-Object {
 *   Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
 *     -Method POST `
 *     -Body (@{email="test@test.com";password="wrong"} | ConvertTo-Json) `
 *     -ContentType "application/json";
 *   Write-Host "Request $_";
 * }
 * 
 * Expected result:
 * Request 1-5: 401 Unauthorized (correct behavior)
 * Request 6+: 429 Too Many Requests (rate limit working!)
 */

export {
  globalLimiter,
  authLimiter,
  uploadLimiter,
  commentLimiter,
  passwordResetLimiter
};
