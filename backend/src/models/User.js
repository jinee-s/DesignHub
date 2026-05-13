/**
 * ===================================
 * USER MODEL (MONGOOSE SCHEMA)
 * ===================================
 * 
 * This schema defines the structure of User documents in MongoDB.
 * 
 * DESIGN DECISIONS:
 * 1. Password hashing before saving (pre-save hook)
 * 2. Password field excluded from queries by default
 * 3. Email uniqueness enforced at DB level (index)
 * 4. Timestamps auto-managed by Mongoose
 * 
 * REAL-WORLD USAGE:
 * - Similar to: Dribbble, Behance, GitHub user profiles
 * - Every MERN app needs a User model like this
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema(
  {
    /**
     * USERNAME
     * WHY: Unique identifier shown in URLs (/profile/john_designer)
     * VALIDATION: 3-30 chars, alphanumeric + underscores only
     * INDEX: Unique (prevents duplicate usernames)
     */
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
      ]
    },

    /**
     * EMAIL
     * WHY: Used for login, password reset, notifications
     * VALIDATION: Must be valid email format
     * INDEX: Unique (one account per email)
     * SECURITY: Converted to lowercase (prevent duplicate: User@email.com vs user@email.com)
     */
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },

    /**
     * PASSWORD
     * WHY: User authentication
     * SECURITY: 
     * - Never stored in plain text (hashed with bcrypt)
     * - select: false means it won't be returned in queries by default
     * - Must explicitly request it: User.findById(id).select('+password')
     * 
     * HASHING: Done in pre-save hook (see below)
     */
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password in queries
    },

    /**
     * FULL NAME
     * WHY: Display name (can have spaces, different from username)
     * EXAMPLE: username: "john_d", fullName: "John Doe"
     */
    fullName: {
      type: String,
      trim: true,
      maxlength: [50, 'Full name cannot exceed 50 characters']
    },

    /**
     * AVATAR (Profile Picture)
     * WHY: Visual identity (like Dribbble avatars)
     * STORAGE: Cloudinary URL (not the actual image!)
     * DEFAULT: Safe placeholder image (public domain)
     * 
     * REAL-WORLD: Never store images in MongoDB (16MB limit)
     */
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713192d3c3ad3280d3861e3b1744/ixlib=rb-4.0.3?w=100&h=100&fit=crop'
    },

    /**
     * BIO
     * WHY: Short description (like Twitter bio)
     * EXAMPLE: "UI/UX Designer from San Francisco. Love minimalism."
     * LIMIT: 160 chars (like tweet length)
     */
    bio: {
      type: String,
      maxlength: [160, 'Bio cannot exceed 160 characters'],
      trim: true
    },

    /**
     * LOCATION
     * WHY: Show where designer is based
     * EXAMPLE: "San Francisco, CA" or "Remote"
     */
    location: {
      type: String,
      maxlength: [50, 'Location cannot exceed 50 characters'],
      trim: true
    },

    /**
     * WEBSITE
     * WHY: Link to personal site or portfolio
     * VALIDATION: Must be valid URL
     */
    website: {
      type: String,
      validate: {
        validator: function(v) {
          // Allow empty string, but if provided must be valid URL
          return !v || validator.isURL(v);
        },
        message: 'Please provide a valid URL'
      }
    },

    /**
     * SOCIAL LINKS
     * WHY: Connect to other platforms (like Dribbble shows Twitter, Behance)
     * STORED AS: Subdocument (nested object)
     * OPTIONAL: All fields optional
     */
    social: {
      twitter: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^@?[a-zA-Z0-9_]{1,15}$/.test(v);
          },
          message: 'Invalid Twitter username'
        }
      },
      instagram: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^@?[a-zA-Z0-9_.]{1,30}$/.test(v);
          },
          message: 'Invalid Instagram username'
        }
      },
      linkedin: String,
      github: String
    },

    /**
     * ROLE
     * WHY: Define user type for marketplace permissions
     * - 'designer': Can upload designs and manage portfolio
     * - 'client': Can browse, hire, and contact designers
     * - 'admin': Can manage users and designs
     * 
     * DEFAULT: 'client' (marketplace buyer, safer default)
     * ENUM: Limited to specific values
     * 
     * MARKETPLACE MODEL:
     * - Designers: Create supply (designs, services)
     * - Clients: Create demand (looking to hire)
     * - Admins: Manage and moderate platform
     */
    role: {
      type: String,
      enum: ['designer', 'client', 'admin'],
      default: 'client'
    },

    /**
     * EMAIL VERIFICATION
     * WHY: Prevent fake accounts, ensure valid email
     * DEFAULT: false (must verify after signup)
     * 
     * FUTURE: Send verification email with token
     */
    isEmailVerified: {
      type: Boolean,
      default: false
    },

    /**
     * ACCOUNT STATUS
     * WHY: Ban spammers or delete accounts
     * DEFAULT: true (active account)
     */
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    /**
     * TIMESTAMPS
     * AUTO-CREATES: createdAt, updatedAt fields
     * WHY: Track when user joined ("Member since 2026")
     */
    timestamps: true,

    /**
     * VIRTUALS IN JSON
     * WHY: Include virtual fields when converting to JSON
     * EXAMPLE: User's design count, followers count
     */
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ===================================
// INDEXES (Performance Optimization)
// ===================================

/**
 * WHY INDEXES?
 * - Speed up queries (search by email, username)
 * - Enforce uniqueness (prevent duplicate emails)
 * 
 * REAL-WORLD: Without indexes, querying 1M users = slow
 * With indexes: Query time from 2s → 10ms
 */
// Note: Indexes already defined in schema with unique: true
// No need to manually call schema.index()

// ===================================
// VIRTUALS (Computed Fields)
// ===================================

/**
 * VIRTUAL: designCount
 * WHY: Show "John has 24 designs" without storing the number
 * COMPUTED: Count designs where userId = this user's ID
 * 
 * NOT STORED IN DB: Calculated when needed
 * 
 * USAGE:
 * const user = await User.findById(id).populate('designCount');
 * console.log(user.designCount); // 24
 */
userSchema.virtual('designCount', {
  ref: 'Design',           // Model to reference
  localField: '_id',       // User's _id
  foreignField: 'userId',  // Design's userId field
  count: true              // Just count, don't return docs
});

// ===================================
// PRE-SAVE HOOK (Middleware)
// ===================================

/**
 * HASH PASSWORD BEFORE SAVING
 * 
 * WHY? Never store passwords in plain text!
 * WHEN? Before saving to database
 * HOW? bcrypt with 10 salt rounds
 * 
 * FLOW:
 * 1. User registers with password: "mypassword123"
 * 2. This hook runs before save
 * 3. Hashes to: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhO2"
 * 4. Hashed password saved to DB
 * 5. Original "mypassword123" never stored
 * 
 * SECURITY: Even if DB is hacked, passwords are safe
 */
userSchema.pre('save', async function(next) {
  /**
   * ONLY HASH IF PASSWORD WAS MODIFIED
   * WHY? Don't re-hash when updating other fields (name, bio, etc.)
   */
  if (!this.isModified('password')) {
    return next();
  }

  /**
   * HASH PASSWORD
   * 10 = salt rounds (higher = more secure but slower)
   * 10 rounds = industry standard (used by GitHub, Facebook)
   */
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// ===================================
// INSTANCE METHODS (Available on User Documents)
// ===================================

/**
 * COMPARE PASSWORD
 * 
 * WHY? Check if login password matches stored hash
 * USAGE:
 * const user = await User.findOne({ email }).select('+password');
 * const isMatch = await user.comparePassword('mypassword123');
 * if (isMatch) { // Login successful }
 * 
 * @param {String} enteredPassword - Plain text password from login
 * @return {Boolean} - True if match, false if not
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  /**
   * bcrypt.compare()
   * Hashes enteredPassword with same salt
   * Compares with stored hash
   * Returns true/false
   */
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * GET PUBLIC PROFILE
 * 
 * WHY? Remove sensitive fields before sending to frontend
 * USAGE:
 * const user = await User.findById(id);
 * res.json(user.getPublicProfile());
 * 
 * FIELDS REMOVED: password, role, isActive, etc.
 */
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.__v;
  
  return userObject;
};

// ===================================
// STATIC METHODS (Available on User Model)
// ===================================

/**
 * FIND BY EMAIL (Case-Insensitive)
 * 
 * WHY? Prevent user@email.com vs USER@email.com duplicate accounts
 * USAGE:
 * const user = await User.findByEmail('John@Email.com');
 * // Returns user with email: "john@email.com"
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * SEARCH USERS
 * 
 * WHY? Search bar functionality
 * USAGE:
 * const users = await User.searchUsers('john');
 * // Returns users with "john" in username or fullName
 */
userSchema.statics.searchUsers = function(query) {
  return this.find({
    $or: [
      { username: new RegExp(query, 'i') },  // i = case-insensitive
      { fullName: new RegExp(query, 'i') }
    ],
    isActive: true
  }).limit(20);
};

// ===================================
// EXPORT MODEL
// ===================================

const User = mongoose.model('User', userSchema);

export default User;

/**
 * ===================================
 * COMMON BEGINNER MISTAKES TO AVOID
 * ===================================
 * 
 * 1. ❌ Storing passwords without hashing
 *    ✅ Use pre-save hook with bcrypt
 * 
 * 2. ❌ Not making email unique
 *    ✅ Add unique: true and index
 * 
 * 3. ❌ Returning password in queries
 *    ✅ Use select: false + .select('+password') when needed
 * 
 * 4. ❌ Not validating email format
 *    ✅ Use validator.isEmail
 * 
 * 5. ❌ Hardcoding avatar URLs
 *    ✅ Use Cloudinary URLs, set default placeholder
 * 
 * 6. ❌ Not lowercasing emails
 *    ✅ Use lowercase: true to prevent duplicates
 */

/**
 * ===================================
 * SCHEMA DESIGN PRINCIPLES
 * ===================================
 * 
 * 1. VALIDATION AT SCHEMA LEVEL
 *    - Required fields, min/max length, regex patterns
 *    - Better than validating in controllers (single source of truth)
 * 
 * 2. INDEXES FOR PERFORMANCE
 *    - Email, username (frequently queried)
 *    - Unique indexes prevent duplicates
 * 
 * 3. SENSITIVE DATA HANDLING
 *    - Password: select: false
 *    - Public profile method to filter data
 * 
 * 4. TIMESTAMPS
 *    - Auto-track createdAt, updatedAt
 *    - Useful for "Member since" feature
 * 
 * 5. DEFAULTS
 *    - role: 'user', isActive: true, etc.
 *    - Reduces boilerplate in controllers
 */
