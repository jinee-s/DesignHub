/**
 * ============================================================================
 * INPUT VALIDATION MIDDLEWARE - PRODUCTION SECURE
 * ============================================================================
 * 
 * WHY INPUT VALIDATION?
 * ---------------------
 * 
 * Prevents common security & data quality issues:
 * 
 * 1. SQL/NoSQL INJECTION:
 *    POST /api/auth/login with:
 *    { "email": {"$gt": ""}, "password": "x" }
 *    
 *    Without validation: Bypasses authentication
 *    With validation: Rejected as invalid type
 * 
 * 2. XSS ATTACKS:
 *    User submits comment: "<script>alert(document.cookie)</script>"
 *    Without validation: Stored in database, executed when viewed
 *    With validation: Rejected or sanitized
 * 
 * 3. DATA QUALITY:
 *    Without validation: Database filled with invalid data
 *    With validation: Only valid data stored
 * 
 * 4. TYPE COERCION ATTACKS:
 *    POST /api/auth/register
 *    { "password": 12345 }
 *    
 *    Without validation: May be converted to string "12345"
 *    With validation: Rejected (must be string)
 * 
 * STACK: Using simple, built-in validation since express-validator
 *        may not be installed. Can be swapped for express-validator later.
 */

/**
 * TYPE VALIDATORS - Check if value is correct type
 */
const isString = (val) => typeof val === 'string' && val.trim().length > 0;
const isEmail = (val) => {
  if (!isString(val)) return false;
  // Simple email regex (not RFC-compliant but good enough)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
};
const isNumber = (val) => typeof val === 'number' && !isNaN(val);
const isBoolean = (val) => typeof val === 'boolean';
const isArray = (val) => Array.isArray(val);
const isObject = (val) => val !== null && typeof val === 'object' && !Array.isArray(val);

/**
 * LENGTH VALIDATORS
 */
const minLength = (val, min) => val.length >= min;
const maxLength = (val, max) => val.length <= max;
const minValue = (val, min) => val >= min;
const maxValue = (val, max) => val <= max;

/**
 * PATTERN VALIDATORS
 */
const isUsername = (val) => {
  if (!isString(val)) return false;
  // Username: 3-30 chars, alphanumeric + underscores/hyphens, no spaces
  return /^[a-zA-Z0-9_-]{3,30}$/.test(val);
};

const isPassword = (val) => {
  if (!isString(val)) return false;
  // Password: at least 8 chars, at least 1 uppercase, 1 lowercase, 1 number
  return val.length >= 8 &&
         /[A-Z]/.test(val) &&
         /[a-z]/.test(val) &&
         /[0-9]/.test(val);
};

const isURL = (val) => {
  if (!isString(val)) return false;
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
};

/**
 * SANITIZE - Remove dangerous characters
 */
const sanitize = (val) => {
  if (!isString(val)) return val;
  return val
    .trim()
    .replace(/[<>]/g, ''); // Remove dangerous HTML chars
};

/**
 * VALIDATION SCHEMAS - Define what args each endpoint expects
 */
const schemas = {
  // Authentication
  register: {
    username: { type: String, validator: isUsername, message: 'Username must be 3-30 characters, alphanumeric only' },
    email: { type: String, validator: isEmail, message: 'Invalid email format' },
    password: { type: String, validator: isPassword, message: 'Password must be 8+ chars with uppercase, lowercase, number' }
  },

  login: {
    email: { type: String, validator: isEmail, message: 'Invalid email format' },
    password: { type: String, message: 'Password is required' }
  },

  updatePassword: {
    currentPassword: { type: String, message: 'Current password is required' },
    newPassword: { type: String, validator: isPassword, message: 'New password must be 8+ chars with uppercase, lowercase, number' }
  },

  // Designs
  createDesign: {
    title: { type: String, validator: isString, message: 'Title is required' },
    imageUrl: { type: String, validator: isURL, message: 'Invalid image URL' },
    thumbnailUrl: { type: String, validator: isURL, message: 'Invalid thumbnail URL' },
    cloudinaryId: { type: String, message: 'Cloudinary ID is required' },
    category: { type: String, validator: isString, message: 'Category is required' },
    description: { type: String, required: false },
    tags: { type: Array, required: false }
  },

  updateDesign: {
    title: { type: String, required: false },
    description: { type: String, required: false },
    category: { type: String, required: false },
    tags: { type: Array, required: false }
  },

  // Comments
  createComment: {
    text: { type: String, validator: isString, message: 'Comment must not be empty' },
    designId: { type: String, validator: isString, message: 'Design ID is required' }
  },

  updateComment: {
    text: { type: String, validator: isString, message: 'Comment must not be empty' }
  }
};

/**
 * VALIDATE - Main validation function
 * 
 * @param {String} schemaName - Name of schema to validate against
 * @returns {Function} Express middleware
 * 
 * USAGE:
 * router.post('/register', validate('register'), registerController)
 */
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      console.error(`❌ Validation schema not found: ${schemaName}`);
      return next(); // Skip validation if schema missing (fail-open)
    }

    const body = req.body || {};
    const errors = [];

    // Check each field in schema
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const value = body[fieldName];

      // Check if field is required
      if (fieldSchema.required !== false && (value === undefined || value === null || value === '')) {
        if (fieldSchema.message) {
          errors.push(fieldSchema.message);
        } else {
          errors.push(`${fieldName} is required`);
        }
        continue;
      }

      // Skip optional fields if not provided
      if (fieldSchema.required === false && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Run custom validator if provided
      if (fieldSchema.validator) {
        if (!fieldSchema.validator(value)) {
          errors.push(fieldSchema.message || `${fieldName} is invalid`);
        }
      }

      // Check type
      if (fieldSchema.type === String && !isString(value)) {
        errors.push(`${fieldName} must be a string`);
      } else if (fieldSchema.type === Number && !isNumber(value)) {
        errors.push(`${fieldName} must be a number`);
      } else if (fieldSchema.type === Boolean && !isBoolean(value)) {
        errors.push(`${fieldName} must be a boolean`);
      } else if (fieldSchema.type === Array && !isArray(value)) {
        errors.push(`${fieldName} must be an array`);
      }
    }

    // Sanitize body
    for (const [key, value] of Object.entries(body)) {
      if (isString(value)) {
        req.body[key] = sanitize(value);
      }
    }

    // If validation failed, return 400 error
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

/**
 * BULK VALIDATE - Validate entire request structure
 * 
 * USE WHEN: Multiple optional fields, flexible structure
 * 
 * USAGE:
 * router.post('/search', bulkValidate({
 *   query: { type: String, required: false },
 *   category: { type: String, required: false },
 *   limit: { type: Number, required: false }
 * }), searchController)
 */
const bulkValidate = (schema) => {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = [];

    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const value = body[fieldName];

      if (fieldSchema.required !== false && (value === undefined || value === null || value === '')) {
        errors.push(fieldSchema.message || `${fieldName} is required`);
        continue;
      }

      if (fieldSchema.required === false && (value === undefined || value === null || value === '')) {
        continue;
      }

      if (fieldSchema.validator && !fieldSchema.validator(value)) {
        errors.push(fieldSchema.message || `${fieldName} is invalid`);
      }

      if (fieldSchema.type === String && !isString(value)) {
        errors.push(`${fieldName} must be a string`);
      } else if (fieldSchema.type === Number && !isNumber(value)) {
        errors.push(`${fieldName} must be a number`);
      } else if (fieldSchema.type === Boolean && !isBoolean(value)) {
        errors.push(`${fieldName} must be a boolean`);
      } else if (fieldSchema.type === Array && !isArray(value)) {
        errors.push(`${fieldName} must be an array`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation failed',
        errors
      });
    }

    // Sanitize all string fields
    for (const [key, value] of Object.entries(body)) {
      if (isString(value)) {
        req.body[key] = sanitize(value);
      }
    }

    next();
  };
};

export {
  validate,
  bulkValidate,
  // Validators
  isString,
  isEmail,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isUsername,
  isPassword,
  isURL,
  minLength,
  maxLength,
  minValue,
  maxValue,
  // Sanitizers
  sanitize
};
