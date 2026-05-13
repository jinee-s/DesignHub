/**
 * ============================================================================
 * CENTRALIZED ERROR HANDLER - PRODUCTION GRADE
 * ============================================================================
 * 
 * WHY CENTRALIZED ERROR HANDLING?
 * -------------------------------
 * Without: Every route needs try-catch, inconsistent errors, code duplication
 * With: ONE place handles ALL errors, consistent format, automatic categorization
 * 
 * USED BY: Facebook, Twitter, Stripe, Netflix, Airbnb, every major API
 */

import { 
  AppError,
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError
} from '../utils/errorClasses.js';

/**
 * Development Error Response - Full details for debugging
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    error: err,
    stack: err.stack // Shows exact line where error occurred
  });
};

/**
 * Production Error Response - Clean, secure error messages
 * 
 * SECURITY CRITICAL:
 * - Never show stack traces (reveals code structure)
 * - Never show internal errors (database details, file paths)
 * - Hide programming errors (only show generic "Something went wrong")
 */
const sendErrorProd = (err, res) => {
  // Operational error (expected, safe to show to user)
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      statusCode: err.statusCode,
      message: err.message
    });
  } 
  // Programming error (unexpected bug, hide details from user!)
  else {
    console.error('💥 ERROR:', err); // Log for developers
    
    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Something went wrong, please try again later'
    });
  }
};

/**
 * MongoDB Duplicate Key Error → 409 Conflict
 * 
 * Example: Registering with email that already exists
 * Raw error: "E11000 duplicate key error collection: designhub.users index: email_1"
 * User sees: "Email 'john@example.com' already exists. Please use a different email."
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists. Please use a different ${field}.`;
  
  return new ConflictError(message);
};

/**
 * MongoDB Validation Error → 400 Bad Request
 * 
 * Example: Missing required field, invalid enum, custom validator failed
 * Combines all validation errors: "Email is required. Password must be at least 8 characters."
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = errors.join('. ');
  
  return new BadRequestError(message);
};

/**
 * Invalid MongoDB ObjectId → 400 Bad Request
 * 
 * Example: GET /api/designs/123 (123 is not valid 24-char hex ObjectId)
 * User sees: "Invalid _id: 123. Please provide a valid ID."
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}. Please provide a valid ID.`;
  
  return new BadRequestError(message);
};

/**
 * JWT Errors → 401 Unauthorized
 */
const handleJWTError = () => {
  return new UnauthorizedError('Invalid token. Please log in again.');
};

const handleJWTExpiredError = () => {
  return new UnauthorizedError('Your session has expired. Please log in again.');
};

/**
 * MAIN ERROR HANDLER MIDDLEWARE
 * 
 * Express signature: (err, req, res, next) - Note 4 parameters!
 * This is the LAST middleware (after all routes)
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  
  // Set defaults
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';
  error.isOperational = err.isOperational || false;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 ERROR DETAILS:');
    console.error('Message:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Operational:', error.isOperational);
  }

  // Convert specific error types to custom errors
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'CastError') error = handleCastError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Send response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * ASYNC ERROR WRAPPER
 * 
 * WHY NEEDED?
 * Express doesn't catch async/await errors automatically!
 * 
 * Without asyncHandler:
 * ❌ const getDesigns = async (req, res) => {
 *      const designs = await Design.find(); // If fails, request hangs!
 *    }
 * 
 * With asyncHandler:
 * ✅ const getDesigns = asyncHandler(async (req, res) => {
 *      const designs = await Design.find(); // Auto-caught!
 *    });
 * 
 * Wraps async functions and catches Promise rejections
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 NOT FOUND HANDLER
 * 
 * For routes that don't exist
 * Place BEFORE errorHandler, AFTER all routes
 * 
 * Example:
 * GET /api/invalid-route → 404 "Route /api/invalid-route not found"
 */
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found on this server`));
};

export {
  errorHandler,
  asyncHandler,
  notFoundHandler
};
