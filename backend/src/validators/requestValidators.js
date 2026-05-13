/**
 * ============================================================================
 * REQUEST VALIDATION - INPUT SANITIZATION & VALIDATION
 * ============================================================================
 * 
 * WHY REQUEST VALIDATION?
 * ----------------------
 * 
 * PROBLEM WITHOUT VALIDATION:
 * --------------------------
 * Users can send ANYTHING:
 * 
 * POST /api/designs
 * {
 *   "title": "",                              ← Empty (should be required)
 *   "description": "<script>alert('XSS')</script>",  ← XSS Attack!
 *   "email": "notanemail",                   ← Invalid format
 *   "age": "twenty",                         ← Wrong type (should be number)
 *   "category": "hacking",                   ← Not in allowed list
 *   "malicious": "DROP TABLE users;--"       ← SQL Injection attempt
 * }
 * 
 * Results:
 * ❌ Database filled with garbage
 * ❌ XSS attacks (steal user cookies)
 * ❌ SQL Injection (delete entire database)
 * ❌ Application crashes (wrong data types)
 * ❌ Security vulnerabilities
 * 
 * SOLUTION WITH VALIDATION:
 * ------------------------
 * Check EVERY input before processing:
 * 
 * ✅ Required fields present
 * ✅ Correct data types
 * ✅ Valid formats (email, URL, phone)
 * ✅ Length limits (min/max)
 * ✅ Allowed values (enums)
 * ✅ Sanitized (no HTML/scripts)
 * 
 * SECURITY LAYERS:
 * ---------------
 * 1. Frontend Validation (UX - instant feedback)
 * 2. Backend Validation (SECURITY - this file!)
 * 3. Database Validation (final check)
 * 
 * NEVER trust client! Always validate on backend!
 * 
 * REAL-WORLD IMPACT:
 * -----------------
 * - Equifax breach: Lack of input validation ($700M cost)
 * - Yahoo breach: XSS through unvalidated input (3B accounts)
 * - Target breach: SQL injection ($18M fine)
 * - Every major API validates ALL inputs
 */

import { body, param, query, validationResult } from 'express-validator';
import { BadRequestError } from '../utils/errorClasses.js';

/**
 * VALIDATION RESULT HANDLER
 * 
 * Checks if validation passed, throws error if failed
 * 
 * HOW IT WORKS:
 * 1. Run validators
 * 2. Express-validator stores errors
 * 3. This function checks for errors
 * 4. If errors exist, throw BadRequestError with all messages
 * 
 * USE AFTER ALL VALIDATORS:
 * router.post('/designs',
 *   validateDesignCreate,  ← Run validations
 *   handleValidationErrors, ← Check results
 *   controller             ← Only runs if validation passed
 * );
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Extract error messages
    const errorMessages = errors.array().map(err => err.msg);
    const message = errorMessages.join('. ');
    
    throw new BadRequestError(message);
  }
  
  next(); // Validation passed, continue to controller
};

/**
 * ============================================================================
 * USER VALIDATION RULES
 * ============================================================================
 */

/**
 * REGISTER VALIDATION
 * 
 * Validates new user registration
 * 
 * CHECKS:
 * - Username: required, 3-20 chars, alphanumeric only
 * - Email: required, valid format, normalized
 * - Password: required, min 8 chars, contains number and letter
 * 
 * WHY THESE RULES?
 * ---------------
 * Username length: Too short = not unique, too long = UI breaks
 * Alphanumeric: Prevents "user!@#$%^" (confusing, potential exploits)
 * Email validation: Prevents typos, ensures deliverable
 * Strong password: Prevents easy guessing (password123, etc.)
 * 
 * SECURITY NOTES:
 * - normalizeEmail() converts "User@Email.COM" → "user@email.com" (prevents duplicates)
 * - trim() removes spaces " john " → "john" (prevents whitespace tricks)
 * - escape() sanitizes HTML/scripts (prevents XSS)
 */
const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3-20 characters')
    .isAlphanumeric().withMessage('Username can only contain letters and numbers')
    .escape(), // Sanitize HTML
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(), // Convert to lowercase, remove dots in Gmail
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
  
  handleValidationErrors
];

/**
 * LOGIN VALIDATION
 * 
 * Simpler than register (user already exists)
 * 
 * CHECKS:
 * - Email: required, valid format
 * - Password: required (don't validate strength, already in DB)
 * 
 * WHY NOT VALIDATE PASSWORD STRENGTH?
 * User already registered with this password
 * Just check if provided (actual validation happens in controller)
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * ============================================================================
 * DESIGN VALIDATION RULES
 * ============================================================================
 */

/**
 * CREATE DESIGN VALIDATION
 * 
 * Validates new design submission
 * 
 * CHECKS:
 * - Title: required, 3-100 chars
 * - Description: optional, max 500 chars
 * - ImageURL: required, valid URL format
 * - ThumbnailURL: optional, valid URL if provided
 * - Category: optional, must be in allowed list
 * - Tags: optional array, max 10 tags, each max 20 chars
 * 
 * WHY THESE LIMITS?
 * ----------------
 * Title 100 chars: Displays nicely in UI, not too verbose
 * Description 500 chars: Enough detail, not essay
 * URL validation: Ensures valid image links (no broken images)
 * Tags limit: Prevents spam tagging, maintains relevance
 */
const validateDesignCreate = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3-100 characters')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be under 500 characters')
    .escape(),
  
  body('imageUrl')
    .trim()
    .notEmpty().withMessage('Image URL is required')
    .isURL().withMessage('Please provide a valid image URL'),
  
  body('thumbnailUrl')
    .optional()
    .trim()
    .isURL().withMessage('Please provide a valid thumbnail URL'),
  
  body('category')
    .optional()
    .trim()
    .isIn(['UI/UX', 'Web Design', 'Mobile Design', 'Graphic Design', 'Illustration', 'Other'])
    .withMessage('Category must be one of: UI/UX, Web Design, Mobile Design, Graphic Design, Illustration, Other'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 }).withMessage('You can add up to 10 tags')
    .custom((tags) => {
      // Check each tag length
      if (tags && tags.some(tag => tag.length > 20)) {
        throw new Error('Each tag must be under 20 characters');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * UPDATE DESIGN VALIDATION
 * 
 * Similar to create, but all fields optional (partial update)
 * 
 * PARTIAL UPDATE EXAMPLE:
 * PATCH /api/designs/123
 * { "title": "New Title" } ← Only update title
 * 
 * Fields not sent remain unchanged
 */
const validateDesignUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3-100 characters')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be under 500 characters')
    .escape(),
  
  body('imageUrl')
    .optional()
    .trim()
    .isURL().withMessage('Please provide a valid image URL'),
  
  body('thumbnailUrl')
    .optional()
    .trim()
    .isURL().withMessage('Please provide a valid thumbnail URL'),
  
  body('category')
    .optional()
    .trim()
    .isIn(['UI/UX', 'Web Design', 'Mobile Design', 'Graphic Design', 'Illustration', 'Other'])
    .withMessage('Invalid category'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 }).withMessage('You can add up to 10 tags'),
  
  handleValidationErrors
];

/**
 * ============================================================================
 * COMMENT VALIDATION RULES
 * ============================================================================
 */

/**
 * CREATE COMMENT VALIDATION
 * 
 * CHECKS:
 * - Content: required, 1-500 chars
 * - ParentId: optional, valid MongoDB ID if provided
 * 
 * WHY THESE RULES?
 * ---------------
 * Min 1 char: No empty comments
 * Max 500: Keeps comments concise (not essays)
 * ParentId validation: Ensures reply structure valid
 * 
 * XSS PREVENTION:
 * escape() converts:
 * "<script>alert('XSS')</script>" → "&lt;script&gt;alert('XSS')&lt;/script&gt;"
 * Browser displays as text, doesn't execute
 */
const validateCommentCreate = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1-500 characters')
    .escape(), // Prevent XSS attacks
  
  body('parentId')
    .optional()
    .isMongoId().withMessage('Invalid parent comment ID'),
  
  handleValidationErrors
];

/**
 * ============================================================================
 * ID VALIDATION (for URL params)
 * ============================================================================
 */

/**
 * MONGODB ID VALIDATION
 * 
 * Validates route parameters like:
 * GET /api/designs/:id
 * DELETE /api/comments/:commentId
 * 
 * CHECKS:
 * - ID is valid MongoDB ObjectId format (24 hex characters)
 * 
 * WHY VALIDATE IDs?
 * ----------------
 * Invalid ID causes MongoDB CastError (crashes query)
 * Better to catch early with clear error message
 * 
 * EXAMPLES:
 * ✅ "507f1f77bcf86cd799439011" (valid 24-char hex)
 * ❌ "123" (too short)
 * ❌ "invalid-id" (not hex)
 * ❌ "507f1f77bcf86cd79943901z" (contains 'z', not hex)
 */
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName}. Please provide a valid ID.`),
  
  handleValidationErrors
];

/**
 * ============================================================================
 * PAGINATION & QUERY VALIDATION
 * ============================================================================
 */

/**
 * PAGINATION VALIDATION
 * 
 * For GET requests with pagination:
 * GET /api/designs?page=2&limit=20
 * 
 * CHECKS:
 * - Page: must be positive integer, default 1
 * - Limit: must be positive integer, max 100, default 10
 * 
 * WHY LIMIT MAX 100?
 * -----------------
 * Prevents abuse:
 * GET /api/designs?limit=999999 ← Loads entire database (slow, memory crash)
 * 
 * With max 100:
 * ✅ Fast queries
 * ✅ Reasonable memory usage
 * ✅ Good UX (100 items enough for one page)
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(), // Convert string "2" to number 2
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  handleValidationErrors
];

/**
 * SEARCH QUERY VALIDATION
 * 
 * For search routes:
 * GET /api/designs/search?q=logo&category=UI/UX
 * 
 * CHECKS:
 * - Search query: min 1 char (no empty searches)
 * - Category: must be in allowed list
 * - Sort: must be valid sort field
 */
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('Search query must be at least 1 character')
    .escape(),
  
  query('category')
    .optional()
    .trim()
    .isIn(['UI/UX', 'Web Design', 'Mobile Design', 'Graphic Design', 'Illustration', 'Other'])
    .withMessage('Invalid category'),
  
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'trending'])
    .withMessage('Sort must be one of: newest, oldest, popular, trending'),
  
  handleValidationErrors
];

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 */

/*
// In routes file:

const {
  validateRegister,
  validateLogin,
  validateDesignCreate,
  validateMongoId
} = require('../validators/requestValidators');

// Auth routes
router.post('/register', validateRegister, registerController);
router.post('/login', validateLogin, loginController);

// Design routes
router.post('/designs', protect, validateDesignCreate, createDesignController);
router.get('/designs/:id', validateMongoId('id'), getDesignController);
router.put('/designs/:id', protect, validateMongoId('id'), validateDesignUpdate, updateDesignController);

// Comment routes
router.post('/designs/:designId/comments',
  protect,
  validateMongoId('designId'),
  validateCommentCreate,
  createCommentController
);

// Search route
router.get('/designs/search', validateSearch, validatePagination, searchDesignsController);
*/

/**
 * ============================================================================
 * TESTING VALIDATION
 * ============================================================================
 */

/*
// Test with PowerShell:

# Valid request
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -Body (@{
    username="john_doe"
    email="john@example.com"
    password="SecurePass123"
  } | ConvertTo-Json) `
  -ContentType "application/json"

# Result: 201 Created ✅

# Invalid request (password too short)
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -Body (@{
    username="john_doe"
    email="john@example.com"
    password="short"
  } | ConvertTo-Json) `
  -ContentType "application/json"

# Result: 400 Bad Request
# {
#   "status": "fail",
#   "statusCode": 400,
#   "message": "Password must be at least 8 characters"
# }

# Invalid request (multiple errors)
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -Body (@{
    username="ab"
    email="not-an-email"
    password="123"
  } | ConvertTo-Json) `
  -ContentType "application/json"

# Result: 400 Bad Request
# {
#   "status": "fail",
#   "statusCode": 400,
#   "message": "Username must be between 3-20 characters. Please provide a valid email address. Password must be at least 8 characters. Password must contain at least one letter and one number"
# }
*/

export {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateDesignCreate,
  validateDesignUpdate,
  validateCommentCreate,
  validateMongoId,
  validatePagination,
  validateSearch
};
