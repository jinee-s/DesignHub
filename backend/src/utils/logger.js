/**
 * ============================================================================
 * LOGGER UTILITY - Production-Safe Logging
 * ============================================================================
 * 
 * Provides consistent logging across the application with different behavior
 * for development vs production environments.
 * 
 * FEATURES:
 * - Automatic log level filtering
 * - Colored console output (dev only)
 * - Stack trace handling
 * - Environment-aware output
 * 
 * USAGE:
 *   import { logger } from './src/utils/logger.js';
 *   
 *   logger.info('User registered', { userId: '123' });
 *   logger.warn('Rate limit approaching');
 *   logger.error('Database connection failed', error);
 */

import colors from 'colors';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4
};

const getCurrentLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL || 'info';
  return LOG_LEVELS[envLevel] || LOG_LEVELS.info;
};

/**
 * FORMAT: [LEVEL] [HH:MM:SS] message
 */
const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

/**
 * DEVELOPMENT: Colorful, detailed output
 */
const logDev = (level, message, data) => {
  const timestamp = formatTimestamp();
  const icons = {
    error: '❌',
    warn: '⚠️ ',
    info: 'ℹ️ ',
    debug: '🐛',
    verbose: '📝'
  };

  const colors_map = {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'magenta',
    verbose: 'gray'
  };

  let output = `[${timestamp}] ${icons[level]} ${message}`;

  if (data) {
    if (data instanceof Error) {
      output += `\n${data.stack}`;
    } else if (typeof data === 'object') {
      output += `\n${JSON.stringify(data, null, 2)}`;
    } else {
      output += ` ${data}`;
    }
  }

  console[level === 'error' || level === 'warn' ? level : 'log'](
    colors[colors_map[level]](output)
  );
};

/**
 * PRODUCTION: Clean, JSON for log aggregation services
 * (Datadog, CloudWatch, Splunk, etc.)
 */
const logProd = (level, message, data) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    environment: process.env.NODE_ENV,
    nodeVersion: process.version
  };

  if (data) {
    if (data instanceof Error) {
      logEntry.error = {
        name: data.name,
        message: data.message,
        stack: data.stack
      };
    } else {
      logEntry.data = data;
    }
  }

  // In production, always output to stdout (Docker/K8s will capture)
  console.log(JSON.stringify(logEntry));
};

/**
 * LOGGER OBJECT
 */
const logger = {
  /**
   * ERROR: Critical failures that require immediate attention
   */
  error: (message, data) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.error) {
      if (process.env.NODE_ENV === 'development') {
        logDev('error', message, data);
      } else {
        logProd('error', message, data);
      }
    }
  },

  /**
   * WARN: Something unexpected but not a failure
   */
  warn: (message, data) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.warn) {
      if (process.env.NODE_ENV === 'development') {
        logDev('warn', message, data);
      } else {
        logProd('warn', message, data);
      }
    }
  },

  /**
   * INFO: Important events (user login, design created, etc.)
   */
  info: (message, data) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.info) {
      if (process.env.NODE_ENV === 'development') {
        logDev('info', message, data);
      } else {
        logProd('info', message, data);
      }
    }
  },

  /**
   * DEBUG: Detailed information for debugging
   */
  debug: (message, data) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.debug) {
      if (process.env.NODE_ENV === 'development') {
        logDev('debug', message, data);
      } else {
        logProd('debug', message, data);
      }
    }
  },

  /**
   * VERBOSE: Most detailed logs
   */
  verbose: (message, data) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.verbose) {
      if (process.env.NODE_ENV === 'development') {
        logDev('verbose', message, data);
      } else {
        logProd('verbose', message, data);
      }
    }
  },

  /**
   * HTTP REQUEST LOGGER
   * Used in middleware for request/response logging
   */
  http: (method, path, statusCode, duration) => {
    const message = `${method} ${path}`;
    const data = { statusCode, duration: `${duration}ms` };

    if (statusCode >= 400) {
      logger.warn(message, data);
    } else {
      logger.debug(message, data);
    }
  }
};

export default logger;

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 * 
 * // Basic
 * logger.info('User registered');
 * 
 * // With data
 * logger.debug('Design created', { designId: '123', userId: '456' });
 * 
 * // Error with stack
 * try {
 *   await db.connect();
 * } catch (err) {
 *   logger.error('DB connection failed', err);
 * }
 * 
 * // HTTP request
 * logger.http('GET', '/api/designs', 200, 45);
 * 
 * // Set log level in .env
 * LOG_LEVEL=verbose  // Most detailed
 * LOG_LEVEL=debug    // Debug info
 * LOG_LEVEL=info     // Normal
 * LOG_LEVEL=warn     // Warnings only
 * LOG_LEVEL=error    // Errors only
 * 
 * ============================================================================
 * DEPLOYMENT
 * ============================================================================
 * 
 * DEVELOPMENT (Local):
 *   - Colored output for readability
 *   - Stack traces, detailed data
 *   - Set LOG_LEVEL=verbose for debugging
 * 
 * PRODUCTION:
 *   - JSON format for log aggregation
 *   - Can be sent to Datadog, CloudWatch, Splunk, etc.
 *   - Set LOG_LEVEL=info or warn
 *   - Structured logs help with monitoring/alerting
 */