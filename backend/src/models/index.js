/**
 * ===================================
 * MODEL EXPORTS
 * ===================================
 * 
 * Central export file for all Mongoose models.
 * Import models from here instead of individual files.
 * 
 * USAGE:
 * import { User, Design, Comment } from './models/index.js';
 * 
 * WHY?
 * - Cleaner imports (single source)
 * - Easy to add new models
 * - Follows module pattern
 */

import User from './User.js';
import Design from './Design.js';
import Comment from './Comment.js';

export { User, Design, Comment };

// Default export (if needed)
export default {
  User,
  Design,
  Comment
};
