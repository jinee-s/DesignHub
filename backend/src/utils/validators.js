/**
 * ===================================
 * INPUT VALIDATORS
 * ===================================
 * 
 * Helper functions to validate user input.
 * 
 * WHY VALIDATE ON BACKEND?
 * Even if frontend validates, users can:
 * - Use Postman to bypass frontend
 * - Modify JavaScript in browser
 * - Send malicious data directly to API
 * 
 * DEFENSE IN DEPTH:
 * ✅ Frontend validation (UX - instant feedback)
 * ✅ Backend validation (Security - enforce rules)
 * ✅ Database validation (Mongoose schemas - last line of defense)
 */

import validator from 'validator';

/**
 * VALIDATE EMAIL
 * 
 * Checks if string is valid email format.
 * 
 * @param {String} email - Email to validate
 * @return {Object} - { valid: boolean, error: string }
 * 
 * EXAMPLES:
 * ✅ "user@example.com" → valid
 * ✅ "john.doe+tag@company.co.uk" → valid
 * ❌ "notanemail" → invalid
 * ❌ "user@" → invalid
 * ❌ "@domain.com" → invalid
 */
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }

  // Trim whitespace
  email = email.trim();

  // Check if valid email format
  if (!validator.isEmail(email)) {
    return { valid: false, error: 'Please provide a valid email address' };
  }

  // Check length (prevent extremely long emails)
  if (email.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  return { valid: true, email: email.toLowerCase() };
};

/**
 * VALIDATE PASSWORD
 * 
 * Checks password strength and requirements.
 * 
 * @param {String} password - Password to validate
 * @return {Object} - { valid: boolean, error: string }
 * 
 * REQUIREMENTS:
 * - Minimum 6 characters (for learning app)
 * - Production apps usually require:
 *   ✅ 8+ characters
 *   ✅ 1 uppercase letter
 *   ✅ 1 lowercase letter
 *   ✅ 1 number
 *   ✅ 1 special character
 * 
 * WHY MINIMUM LENGTH?
 * - Prevents brute force attacks
 * - 6 chars = 308,915,776 combinations (lowercase only)
 * - 8 chars = 208,827,064,576 combinations
 * 
 * REAL-WORLD REQUIREMENTS:
 * - Gmail: 8 characters
 * - Facebook: 6 characters
 * - Banking apps: 8-12 characters + complexity
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }

  // Minimum length
  if (password.length < 6) {
    return {
      valid: false,
      error: 'Password must be at least 6 characters long'
    };
  }

  // Maximum length (prevent DoS via long passwords)
  // bcrypt has max of 72 bytes
  if (password.length > 72) {
    return {
      valid: false,
      error: 'Password is too long (max 72 characters)'
    };
  }

  /**
   * OPTIONAL: Stronger password requirements (for production)
   * Uncomment these for real apps:
   */
  
  // // Require at least one uppercase letter
  // if (!/[A-Z]/.test(password)) {
  //   return {
  //     valid: false,
  //     error: 'Password must contain at least one uppercase letter'
  //   };
  // }

  // // Require at least one lowercase letter
  // if (!/[a-z]/.test(password)) {
  //   return {
  //     valid: false,
  //     error: 'Password must contain at least one lowercase letter'
  //   };
  // }

  // // Require at least one number
  // if (!/[0-9]/.test(password)) {
  //   return {
  //     valid: false,
  //     error: 'Password must contain at least one number'
  //   };
  // }

  // // Require at least one special character
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   return {
  //     valid: false,
  //     error: 'Password must contain at least one special character'
  //   };
  // }

  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', '111111', 'admin', 'letmein', 'welcome'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    return {
      valid: false,
      error: 'This password is too common. Please choose a stronger password.'
    };
  }

  return { valid: true };
};

/**
 * VALIDATE USERNAME
 * 
 * Checks if username meets requirements.
 * 
 * @param {String} username - Username to validate
 * @return {Object} - { valid: boolean, error: string }
 * 
 * REQUIREMENTS:
 * - 3-30 characters
 * - Alphanumeric + underscores only
 * - No spaces
 * 
 * WHY THESE RESTRICTIONS?
 * ✅ URL-friendly: username appears in URLs (/profile/john_designer)
 * ✅ Database-friendly: Simple indexing and searching
 * ✅ Prevents confusion: No special characters that look alike (0 vs O)
 * 
 * EXAMPLES:
 * ✅ "john_designer" → valid
 * ✅ "sarah_123" → valid
 * ❌ "john designer" → invalid (space)
 * ❌ "john@designer" → invalid (special char)
 * ❌ "ab" → invalid (too short)
 */
export const validateUsername = (username) => {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }

  if (typeof username !== 'string') {
    return { valid: false, error: 'Username must be a string' };
  }

  // Trim whitespace
  username = username.trim();

  // Length check
  if (username.length < 3) {
    return {
      valid: false,
      error: 'Username must be at least 3 characters long'
    };
  }

  if (username.length > 30) {
    return {
      valid: false,
      error: 'Username cannot exceed 30 characters'
    };
  }

  // Format check (alphanumeric + underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores'
    };
  }

  // Prevent starting with underscore (looks weird)
  if (username.startsWith('_')) {
    return {
      valid: false,
      error: 'Username cannot start with an underscore'
    };
  }

  // Prevent reserved words
  const reservedWords = [
    'admin', 'api', 'auth', 'login', 'logout', 'register',
    'signup', 'signin', 'user', 'users', 'profile', 'settings',
    'help', 'support', 'about', 'contact', 'terms', 'privacy'
  ];

  if (reservedWords.includes(username.toLowerCase())) {
    return {
      valid: false,
      error: 'This username is reserved. Please choose another one.'
    };
  }

  return { valid: true, username };
};

/**
 * SANITIZE INPUT
 * 
 * Removes potentially dangerous characters.
 * Prevents XSS (Cross-Site Scripting) attacks.
 * 
 * @param {String} input - User input to sanitize
 * @return {String} - Sanitized input
 * 
 * WHAT IS XSS?
 * Attacker injects JavaScript into your app:
 * 
 * User bio: "<script>alert('hacked')</script>"
 * If you render this in HTML without sanitizing, script runs!
 * 
 * DEFENSE:
 * 1. Escape HTML (convert < to &lt;, > to &gt;)
 * 2. Use Content Security Policy (CSP) headers
 * 3. Validate and sanitize on backend
 * 
 * NOTE: For rich text (comments, descriptions), use
 * a dedicated library like DOMPurify or sanitize-html
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return validator.escape(input); // Escapes HTML characters
};

/**
 * VALIDATE REGISTRATION DATA
 * 
 * Validates all required fields for user registration.
 * One-stop validation for register endpoint.
 * 
 * @param {Object} data - { username, email, password }
 * @return {Object} - { valid: boolean, errors: array, data: object }
 */
export const validateRegisterData = (data) => {
  const errors = [];
  const validatedData = {};

  // Validate username
  const usernameCheck = validateUsername(data.username);
  if (!usernameCheck.valid) {
    errors.push(usernameCheck.error);
  } else {
    validatedData.username = usernameCheck.username;
  }

  // Validate email
  const emailCheck = validateEmail(data.email);
  if (!emailCheck.valid) {
    errors.push(emailCheck.error);
  } else {
    validatedData.email = emailCheck.email;
  }

  // Validate password
  const passwordCheck = validatePassword(data.password);
  if (!passwordCheck.valid) {
    errors.push(passwordCheck.error);
  } else {
    validatedData.password = data.password; // Don't modify password
  }

  return {
    valid: errors.length === 0,
    errors,
    data: validatedData
  };
};

/**
 * VALIDATE LOGIN DATA
 * 
 * Validates email and password for login.
 * 
 * @param {Object} data - { email, password }
 * @return {Object} - { valid: boolean, errors: array, data: object }
 */
export const validateLoginData = (data) => {
  const errors = [];
  const validatedData = {};

  // Validate email
  const emailCheck = validateEmail(data.email);
  if (!emailCheck.valid) {
    errors.push(emailCheck.error);
  } else {
    validatedData.email = emailCheck.email;
  }

  // Check password exists (don't validate strength for login)
  if (!data.password) {
    errors.push('Password is required');
  } else {
    validatedData.password = data.password;
  }

  return {
    valid: errors.length === 0,
    errors,
    data: validatedData
  };
};

/**
 * ===================================
 * SECURITY BEST PRACTICES
 * ===================================
 * 
 * 1. NEVER trust user input
 *    ✅ Always validate
 *    ✅ Always sanitize
 *    ✅ Use whitelist (allowed chars) not blacklist
 * 
 * 2. Validate on BOTH frontend and backend
 *    ✅ Frontend: Better UX (instant feedback)
 *    ✅ Backend: Security (can't be bypassed)
 * 
 * 3. Use established libraries
 *    ✅ validator (email, URL, etc.)
 *    ✅ DOMPurify (sanitize HTML)
 *    ❌ Don't write regex for email validation (complex!)
 * 
 * 4. Limit input length
 *    ✅ Prevents DoS attacks (huge inputs crash server)
 *    ✅ Email max 254 chars (RFC standard)
 *    ✅ Password max 72 chars (bcrypt limit)
 * 
 * 5. Give generic error messages
 *    ❌ "Email already exists" → Reveals user exists
 *    ✅ "Invalid credentials" → Generic (for login)
 *    
 *    Exception: Registration can be specific
 *    (User needs to know why username/email rejected)
 */

/**
 * ===================================
 * COMMON VALIDATION MISTAKES
 * ===================================
 * 
 * 1. ❌ Only validating on frontend
 *    Problem: Easy to bypass with Postman
 *    ✅ Always validate on backend too
 * 
 * 2. ❌ Using weak regex for email
 *    /^[^@]+@[^@]+\.[^@]+$/  ← Too simple!
 *    ✅ Use validator.isEmail() (handles 99% of cases)
 * 
 * 3. ❌ Not limiting input length
 *    Problem: User sends 1GB password → Server crashes
 *    ✅ Check length before processing
 * 
 * 4. ❌ Revealing too much info in errors
 *    "User with email john@email.com does not exist"
 *    → Attacker knows john@email.com is not registered
 *    ✅ "Invalid credentials" (generic)
 * 
 * 5. ❌ Not sanitizing HTML
 *    User bio: "<script>alert('xss')</script>"
 *    Problem: XSS attack when rendered
 *    ✅ Escape HTML or use DOMPurify
 * 
 * 6. ❌ Allowing weak passwords
 *    "123456", "password"
 *    ✅ Check against common password list
 *    ✅ Enforce minimum length
 * 
 * 7. ❌ Case-sensitive email comparison
 *    "User@Email.com" ≠ "user@email.com"
 *    ✅ Convert to lowercase before storing/comparing
 */
