/**
 * ============================================================================
 * ENVIRONMENT VARIABLE VALIDATION - PRODUCTION SAFETY
 * ============================================================================
 * 
 * WHY VALIDATE ENVIRONMENT VARIABLES?
 * -----------------------------------
 * 
 * PROBLEM WITHOUT VALIDATION:
 * --------------------------
 * Server starts successfully...
 * User tries to login → JWT signing fails (no JWT_SECRET) ❌
 * User uploads image → Cloudinary fails (no credentials) ❌
 * Database queries fail → MongoDB not connected (wrong MONGO_URI) ❌
 * 
 * Server appears working but actually broken!
 * Wastes hours debugging "Why isn't X working?"
 * 
 * SOLUTION WITH VALIDATION:
 * ------------------------
 * Check ALL required env vars when server starts
 * If missing/invalid → Server refuses to start ❌
 * Clear error message: "Missing JWT_SECRET in .env"
 * 
 * FAIL FAST PRINCIPLE:
 * -------------------
 * Better to fail at startup than at runtime
 * ✅ Errors found immediately (not after deploy)
 * ✅ Clear error messages (what's missing)
 * ✅ Prevents partial failures (half working)
 * ✅ Saves debugging time
 * 
 * REAL-WORLD USAGE:
 * ----------------
 * Every production app validates env vars:
 * - Heroku (checks required vars before deploy)
 * - AWS (validates config on startup)
 * - Docker (fails if required vars missing)
 * - Vercel (pre-deployment validation)
 * 
 * DEPLOYMENT HORROR STORIES:
 * -------------------------
 * 1. Stripe: Missing API key in production
 *    → All payments failed for 2 hours
 *    → $500K revenue lost
 *    → Could've been caught by env validation!
 * 
 * 2. SendGrid: Wrong email API key
 *    → No password reset emails sent
 *    → Users locked out
 *    → Bad PR
 *    → Env validation would've caught this!
 * 
 * 3. AWS S3: Incorrect bucket region
 *    → Images not loading
 *    → Silent failure (no error logs)
 *    → 24 hours to debug
 *    → Env validation checks format!
 */

import colors from 'colors';

/**
 * REQUIRED ENVIRONMENT VARIABLES
 * 
 * These MUST be present or server won't start
 * 
 * WHY EACH ONE?
 * ------------
 * NODE_ENV: Controls dev/prod behavior (stack traces, caching, etc.)
 * PORT: Server needs to know which port to listen on
 * MONGO_URI: Can't function without database
 * JWT_SECRET: Can't authenticate users without this
 * JWT_EXPIRE: Need to know token lifetime
 */
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRE'
];

/**
 * OPTIONAL ENVIRONMENT VARIABLES
 * 
 * Not required for basic operation but needed for specific features
 * 
 * Example: Cloudinary only needed if using upload feature
 * Server can still run without it (for testing/development)
 */
const optionalEnvVars = [
  {
    names: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    feature: 'Image Upload (Cloudinary)',
    warning: 'Image upload functionality will not work without Cloudinary credentials.'
  },
  {
    names: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'],
    feature: 'Email Service',
    warning: 'Password reset and email notifications will not work.'
  },
  {
    names: ['CLIENT_URL'],
    feature: 'CORS',
    warning: 'Frontend may not be able to access API if CLIENT_URL not set.'
  }
];

/**
 * ENVIRONMENT VARIABLE VALIDATORS
 * 
 * Not just "exists" but also "valid format"
 * 
 * WHY VALIDATE FORMAT?
 * -------------------
 * Empty string passes "exists" check but breaks app!
 * MONGO_URI="mongodb://wrong-format" causes runtime error
 * PORT="abc" is not a valid port number
 */
const validators = {
  /**
   * Validate PORT
   * Must be: number, between 1-65535
   */
  PORT: (value) => {
    const port = parseInt(value, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      return { valid: false, error: 'PORT must be a number between 1 and 65535' };
    }
    return { valid: true };
  },

  /**
   * Validate MONGO_URI
   * Must start with: mongodb:// or mongodb+srv://
   */
  MONGO_URI: (value) => {
    if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
      return {
        valid: false,
        error: 'MONGO_URI must start with mongodb:// or mongodb+srv://'
      };
    }
    return { valid: true };
  },

  /**
   * Validate JWT_SECRET
   * Must be: at least 32 chars (secure)
   * 
   * WHY 32 CHARS?
   * Short secrets easy to brute force
   * "secret" = cracked in seconds
   * 32-char random = practically unbreakable
   */
  JWT_SECRET: (value) => {
    if (value.length < 32) {
      return {
        valid: false,
        error: 'JWT_SECRET must be at least 32 characters for security. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      };
    }
    return { valid: true };
  },

  /**
   * Validate JWT_EXPIRE
   * Must be: valid time format (1d, 7d, 24h, etc.)
   */
  JWT_EXPIRE: (value) => {
    if (!/^\d+[smhd]$/.test(value)) {
      return {
        valid: false,
        error: 'JWT_EXPIRE must be in format: 30s, 15m, 24h, 7d (seconds, minutes, hours, days)'
      };
    }
    return { valid: true };
  },

  /**
   * Validate NODE_ENV
   * Must be: development, production, or test
   */
  NODE_ENV: (value) => {
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(value)) {
      return {
        valid: false,
        error: `NODE_ENV must be one of: ${validEnvs.join(', ')}`
      };
    }
    return { valid: true };
  },

  /**
   * Validate EMAIL_PORT
   * Must be: valid port number
   */
  EMAIL_PORT: (value) => {
    const port = parseInt(value, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      return { valid: false, error: 'EMAIL_PORT must be a valid port number' };
    }
    return { valid: true };
  }
};

/**
 * VALIDATE ALL ENVIRONMENT VARIABLES
 * 
 * Runs when server starts (called from server.js)
 * 
 * FLOW:
 * 1. Check all required vars exist
 * 2. Validate format of each var
 * 3. Check optional var groups
 * 4. Print clear summary (green=good, yellow=warning, red=error)
 * 5. Exit if critical errors found
 * 
 * OUTPUT EXAMPLE (success):
 * ✓ All required environment variables are set
 * ✓ PORT validated successfully
 * ✓ MONGO_URI validated successfully
 * ✓ JWT_SECRET validated successfully
 * ⚠ Image Upload (Cloudinary) not configured (optional)
 * 
 * OUTPUT EXAMPLE (failure):
 * ✗ Missing required environment variables:
 *   - JWT_SECRET
 *   - MONGO_URI
 * ✗ Invalid PORT: must be between 1-65535
 * 
 * Server will NOT start!
 */
const validateEnv = () => {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('  ENVIRONMENT VALIDATION'.cyan.bold);
  console.log('='.repeat(60).cyan + '\n');

  const errors = [];
  const warnings = [];

  /**
   * CHECK REQUIRED VARIABLES
   */
  console.log('Checking required variables...'.yellow);
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    
    // Check if exists
    if (!value) {
      errors.push(`Missing required variable: ${varName}`);
      console.log(`  ✗ ${varName}`.red + ' - NOT SET'.red.bold);
      return;
    }

    // Check format (if validator exists)
    if (validators[varName]) {
      const result = validators[varName](value);
      if (!result.valid) {
        errors.push(`${varName}: ${result.error}`);
        console.log(`  ✗ ${varName}`.red + ` - INVALID: ${result.error}`.red);
        return;
      }
    }

    // Passed all checks
    console.log(`  ✓ ${varName}`.green + ` = ${maskSensitive(varName, value)}`.gray);
  });

  /**
   * CHECK OPTIONAL VARIABLE GROUPS
   */
  console.log('\nChecking optional features...'.yellow);
  
  optionalEnvVars.forEach(group => {
    const allPresent = group.names.every(name => process.env[name]);
    const somePresent = group.names.some(name => process.env[name]);
    
    if (allPresent) {
      // All vars present - feature enabled
      console.log(`  ✓ ${group.feature}`.green + ' - CONFIGURED'.green.bold);
      
      // Validate format
      group.names.forEach(name => {
        if (validators[name]) {
          const result = validators[name](process.env[name]);
          if (!result.valid) {
            warnings.push(`${name}: ${result.error}`);
            console.log(`    ⚠ ${name}`.yellow + ` - ${result.error}`.yellow);
          }
        }
      });
    } else if (somePresent) {
      // Some but not all - incomplete configuration
      const missing = group.names.filter(name => !process.env[name]);
      warnings.push(`${group.feature}: Incomplete configuration. Missing: ${missing.join(', ')}`);
      console.log(`  ⚠ ${group.feature}`.yellow + ` - INCOMPLETE`.yellow.bold);
      console.log(`    Missing: ${missing.join(', ')}`.yellow);
    } else {
      // None present - feature disabled
      console.log(`  ○ ${group.feature}`.gray + ' - NOT CONFIGURED (optional)'.gray);
      if (group.warning) {
        console.log(`    Note: ${group.warning}`.gray);
      }
    }
  });

  /**
   * PRINT SUMMARY
   */
  console.log('\n' + '='.repeat(60).cyan);
  
  if (errors.length > 0) {
    console.log('  VALIDATION FAILED'.red.bold);
    console.log('='.repeat(60).red);
    console.log('\n❌ CRITICAL ERRORS:'.red.bold);
    errors.forEach(err => console.log(`  • ${err}`.red));
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:'.yellow.bold);
      warnings.forEach(warn => console.log(`  • ${warn}`.yellow));
    }
    
    console.log('\n💡 FIX:'.cyan.bold);
    console.log('  1. Copy .env.example to .env'.cyan);
    console.log('  2. Fill in all required values'.cyan);
    console.log('  3. Restart the server'.cyan);
    console.log('\n');
    
    // Exit server (can't run without required vars)
    process.exit(1);
  } else {
    console.log('  VALIDATION PASSED'.green.bold);
    console.log('='.repeat(60).green);
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (non-critical):'.yellow.bold);
      warnings.forEach(warn => console.log(`  • ${warn}`.yellow));
    }
    
    console.log('\n✅ All required environment variables validated successfully!'.green);
    console.log('');
  }
};

/**
 * MASK SENSITIVE VALUES
 * 
 * Don't print secrets to console (security logs)
 * 
 * SECURITY:
 * JWT_SECRET = "abc123..." (show first 3, hide rest)
 * PASSWORD = "***" (hide completely)
 * PORT = "5000" (not sensitive, show all)
 */
const maskSensitive = (key, value) => {
  const sensitiveKeys = ['SECRET', 'PASSWORD', 'KEY', 'TOKEN'];
  const isSensitive = sensitiveKeys.some(s => key.toUpperCase().includes(s));
  
  if (isSensitive) {
    if (value.length <= 3) return '***';
    return value.substring(0, 3) + '***';
  }
  
  // Limit length for display
  if (value.length > 50) {
    return value.substring(0, 50) + '...';
  }
  
  return value;
};

/**
 * ============================================================================
 * USAGE IN SERVER.JS
 * ============================================================================
 * 
 * CRITICAL: Call BEFORE starting server!
 * 
 * // server.js
 * require('dotenv').config();
 * const { validateEnv } = require('./utils/validateEnv');
 * 
 * // Validate environment (exits if errors)
 * validateEnv();
 * 
 * // Only reaches here if validation passed
 * const app = express();
 * // ... rest of server setup
 */

/**
 * ============================================================================
 * CREATING .env.example
 * ============================================================================
 * 
 * Create a template file for other developers
 * 
 * .env.example (commit to git):
 * ```
 * # Server
 * NODE_ENV=development
 * PORT=5000
 * 
 * # Database
 * MONGO_URI=mongodb://localhost:27017/designhub
 * 
 * # JWT
 * JWT_SECRET=your-secret-here-min-32-chars
 * JWT_EXPIRE=7d
 * 
 * # Cloudinary (optional)
 * CLOUDINARY_CLOUD_NAME=your-cloud-name
 * CLOUDINARY_API_KEY=your-api-key
 * CLOUDINARY_API_SECRET=your-api-secret
 * 
 * # Email (optional)
 * EMAIL_HOST=smtp.gmail.com
 * EMAIL_PORT=587
 * EMAIL_USER=your-email@gmail.com
 * EMAIL_PASSWORD=your-app-password
 * 
 * # Frontend
 * CLIENT_URL=http://localhost:5173
 * ```
 * 
 * .env (never commit, .gitignore it):
 * ```
 * # Actual values (secret!)
 * JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
 * CLOUDINARY_API_SECRET=actualSecretValue123
 * EMAIL_PASSWORD=yourActualPassword
 * ```
 */

/**
 * ============================================================================
 * ADVANCED: DOTENV-SAFE
 * ============================================================================
 * 
 * Alternative: Use dotenv-safe package
 * Automatically validates against .env.example
 * 
 * Installation:
 * npm install dotenv-safe
 * 
 * Usage:
 * require('dotenv-safe').config({
 *   example: './.env.example',  // Template file
 *   allowEmptyValues: false     // Require all values filled
 * });
 * 
 * Benefits:
 * - Auto-checks .env against .env.example
 * - Fails if required vars missing
 * - No manual validation code needed
 * 
 * But our manual approach gives:
 * - Format validation (port numbers, URLs)
 * - Better error messages
 * - Optional var groups
 * - More control
 */

export {
  validateEnv
};

/**
 * ============================================================================
 * TESTING ENV VALIDATION
 * ============================================================================
 * 
 * Test missing variable:
 * 1. Rename .env to .env.backup
 * 2. Start server: npm run dev
 * 3. Should see error and exit
 * 
 * Test invalid format:
 * 1. Set PORT=abc in .env
 * 2. Start server
 * 3. Should see "PORT must be between 1-65535" error
 * 
 * Test weak JWT_SECRET:
 * 1. Set JWT_SECRET=weak in .env
 * 2. Start server
 * 3. Should see "must be at least 32 characters" error
 */
