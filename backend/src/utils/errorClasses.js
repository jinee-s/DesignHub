/**
 * ============================================================================
 * CUSTOM ERROR CLASSES
 * ============================================================================
 * 
 * WHY CUSTOM ERROR CLASSES?
 * ------------------------
 * In production apps, not all errors are the same. We need to distinguish:
 * 
 * 1. Client Errors (400s) - User made a mistake
 *    - 400 Bad Request (validation failed)
 *    - 401 Unauthorized (not logged in)
 *    - 403 Forbidden (logged in but no permission)
 *    - 404 Not Found (resource doesn't exist)
 * 
 * 2. Server Errors (500s) - Our code has a bug
 *    - 500 Internal Server Error (unexpected crashes)
 * 
 * PROBLEM WITHOUT CUSTOM ERRORS:
 * -----------------------------
 * throw new Error('User not found'); // Always becomes 500 error! ❌
 * 
 * User sees: "Internal Server Error" (scary, looks like our bug)
 * Reality: User just typed wrong ID (their mistake, should be 404)
 * 
 * SOLUTION WITH CUSTOM ERRORS:
 * ---------------------------
 * throw new NotFoundError('User not found'); // Becomes 404 ✅
 * 
 * Benefits:
 * - Correct HTTP status codes
 * - Better error messages for users
 * - Easier debugging (know if it's client or server error)
 * - Monitoring tools can distinguish error types
 * 
 * REAL-WORLD EXAMPLE:
 * ------------------
 * Without Custom Errors:
 *   try {
 *     const user = await User.findById(id);
 *     if (!user) throw new Error('Not found'); // 500 error
 *   } catch (err) {
 *     res.status(500).json({ error: 'Internal Server Error' }); ❌
 *   }
 * 
 * With Custom Errors:
 *   const user = await User.findById(id);
 *   if (!user) throw new NotFoundError('User not found'); // 404 error ✅
 *   // Error handler middleware automatically sends correct status code
 */

/**
 * Base class for all operational errors (expected errors)
 * 
 * WHY EXTEND Error CLASS?
 * -----------------------
 * JavaScript's Error class provides:
 * - .message property (error description)
 * - .stack property (where error occurred - crucial for debugging!)
 * - Proper error handling in try-catch blocks
 * 
 * We add:
 * - statusCode (HTTP status for response)
 * - isOperational flag (marks as expected error, not a bug)
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Call Error constructor to set message and stack trace
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Mark as expected error (safe to show to user)

    // Capture stack trace (shows exactly where error was thrown)
    // Example stack trace:
    //   NotFoundError: User not found
    //     at getUserById (controllers/userController.js:45:11)
    //     at async Route.<anonymous> (routes/userRoutes.js:12:3)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - User sent invalid data
 * 
 * USE WHEN:
 * - Validation fails (missing fields, wrong format)
 * - Business logic violations (can't delete design with comments)
 * - Invalid operation (can't like your own design)
 * 
 * EXAMPLES:
 * throw new BadRequestError('Email is required');
 * throw new BadRequestError('Password must be at least 8 characters');
 * throw new BadRequestError('Cannot delete design with existing comments');
 * 
 * WHY 400 NOT 500?
 * User made a mistake (sent bad data) → Client error (400)
 * Our code has a bug (crashed) → Server error (500)
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized - User not authenticated
 * 
 * USE WHEN:
 * - No token provided (user not logged in)
 * - Token expired
 * - Token invalid/malformed
 * - Wrong password
 * 
 * EXAMPLES:
 * throw new UnauthorizedError('Please log in to access this resource');
 * throw new UnauthorizedError('Invalid credentials');
 * throw new UnauthorizedError('Token expired, please log in again');
 * 
 * SECURITY NOTE:
 * Don't reveal too much! ❌ "User exists but wrong password"
 * Keep it vague: ✅ "Invalid credentials"
 * (Prevents attackers from knowing if email exists)
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized - Please log in') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden - User authenticated but lacks permission
 * 
 * USE WHEN:
 * - Trying to edit someone else's design
 * - Trying to delete someone else's comment
 * - Admin-only route accessed by regular user
 * 
 * EXAMPLES:
 * throw new ForbiddenError('You can only edit your own designs');
 * throw new ForbiddenError('Admin access required');
 * throw new ForbiddenError('Cannot delete other users\' comments');
 * 
 * 401 vs 403 - WHAT'S THE DIFFERENCE?
 * 401: "I don't know who you are" (not logged in)
 * 403: "I know who you are, but you can't do this" (no permission)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden - You do not have permission') {
    super(message, 403);
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 * 
 * USE WHEN:
 * - Design ID not in database
 * - User ID not found
 * - Comment doesn't exist
 * - Route doesn't exist
 * 
 * EXAMPLES:
 * throw new NotFoundError('Design not found');
 * throw new NotFoundError('User not found');
 * throw new NotFoundError(`No comment found with ID: ${id}`);
 * 
 * WHY NOT 500?
 * If user requests /api/designs/999 and ID 999 doesn't exist:
 * - Not our bug (database is working fine)
 * - User provided invalid ID (their mistake)
 * - Should be 404, not 500
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 * 
 * USE WHEN:
 * - Duplicate email/username registration
 * - Trying to create resource that already exists
 * - State conflicts (can't publish already published design)
 * 
 * EXAMPLES:
 * throw new ConflictError('Email already registered');
 * throw new ConflictError('Username already taken');
 * throw new ConflictError('Design already published');
 * 
 * WHY NOT 400?
 * - 400: Generic validation error (format wrong, missing field)
 * - 409: Specific conflict with existing data (duplicate, state issue)
 */
class ConflictError extends AppError {
  constructor(message = 'Conflict - Resource already exists') {
    super(message, 409);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 * 
 * USE WHEN:
 * - User exceeded API rate limit
 * - Too many login attempts
 * - Spam protection triggered
 * 
 * EXAMPLES:
 * throw new RateLimitError('Too many requests, please try again later');
 * throw new RateLimitError('Too many login attempts, account locked for 15 minutes');
 * 
 * WHY RATE LIMITING?
 * Prevents:
 * - Brute force attacks (trying 1000 passwords)
 * - DDoS attacks (overwhelming server)
 * - Resource exhaustion (uploading 100 images/second)
 * - API abuse (scraping all data)
 */
class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests - Please slow down') {
    super(message, 429);
  }
}

/**
 * 500 Internal Server Error - Unexpected programming error
 * 
 * USE WHEN:
 * - Database connection fails
 * - External API fails (Cloudinary down)
 * - Unexpected null/undefined (bug in our code)
 * - Any unhandled exception
 * 
 * EXAMPLES:
 * throw new InternalServerError('Database connection failed');
 * throw new InternalServerError('Failed to upload image to Cloudinary');
 * 
 * IMPORTANT:
 * - Don't show detailed error to user (security risk)
 * - Log full error details to console/log file
 * - Send generic message to user: "Something went wrong"
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
    this.isOperational = false; // Marks as programming error (bug)
  }
}

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 */

/*
// BEFORE (without custom errors) ❌
const getDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);
    if (!design) {
      return res.status(404).json({ error: 'Not found' }); // Manual status code
    }
    res.json(design);
  } catch (err) {
    res.status(500).json({ error: 'Server error' }); // Always 500!
  }
};

// AFTER (with custom errors) ✅
const getDesign = async (req, res) => {
  const design = await Design.findById(req.params.id);
  if (!design) {
    throw new NotFoundError('Design not found'); // Automatic 404
  }
  res.json(design);
  // No try-catch needed! Error handler middleware catches it
};

// ============================================================================

// VALIDATION EXAMPLE
const createDesign = async (req, res) => {
  const { title, imageUrl } = req.body;
  
  if (!title) {
    throw new BadRequestError('Title is required');
  }
  
  if (!imageUrl) {
    throw new BadRequestError('Image URL is required');
  }
  
  if (title.length < 3) {
    throw new BadRequestError('Title must be at least 3 characters');
  }
  
  const design = await Design.create({ title, imageUrl, user: req.user.id });
  res.status(201).json({ success: true, data: design });
};

// ============================================================================

// AUTHORIZATION EXAMPLE
const deleteDesign = async (req, res) => {
  const design = await Design.findById(req.params.id);
  
  if (!design) {
    throw new NotFoundError('Design not found');
  }
  
  // Check if user owns this design
  if (design.user.toString() !== req.user.id) {
    throw new ForbiddenError('You can only delete your own designs');
  }
  
  await design.deleteOne();
  res.json({ success: true, message: 'Design deleted' });
};

// ============================================================================

// DUPLICATE CHECK EXAMPLE
const register = async (req, res) => {
  const { email, username, password } = req.body;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }
  
  const user = await User.create({ email, username, password });
  res.status(201).json({ success: true, data: user });
};
*/

/**
 * ============================================================================
 * ERROR HANDLING FLOW
 * ============================================================================
 * 
 * 1. Code throws custom error:
 *    throw new NotFoundError('Design not found');
 * 
 * 2. Express catches error (because we use async/await or asyncHandler)
 * 
 * 3. Error handler middleware receives error:
 *    app.use((err, req, res, next) => { ... })
 * 
 * 4. Error handler checks error type:
 *    if (err.isOperational) {
 *      // Safe to show user (NotFoundError, BadRequestError, etc.)
 *      res.status(err.statusCode).json({ error: err.message });
 *    } else {
 *      // Programming error/bug (don't expose details!)
 *      console.error(err); // Log for debugging
 *      res.status(500).json({ error: 'Something went wrong' });
 *    }
 * 
 * 5. User receives appropriate response:
 *    404 { error: 'Design not found' } ✅
 *    NOT 500 { error: 'Internal Server Error' } ❌
 */

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError
};
