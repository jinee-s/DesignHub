/**
 * Placeholder Assets & Defaults
 *
 * Safe placeholder images for development and fallback UI
 * These are from public sources that allow free usage
 */

/**
 * Default user avatar
 * Using initials-based avatar generation (generated at runtime)
 * Fallback: A public domain silhouette avatar
 */
export const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23d1d5db%22%3E%3Cpath d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z%22/%3E%3C/svg%3E';

/**
 * Default placeholder design image
 * Clean, minimal SVG gradient - indicates "no image loaded"
 * Professional gray gradient instead of broken image icon
 */
export const DEFAULT_DESIGN_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%23f3f4f6;stop-opacity:1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%23e5e7eb;stop-opacity:1%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22800%22 height=%22600%22 fill=%22url(%23grad)%22/%3E%3Crect x=%22350%22 y=%22270%22 width=%22100%22 height=%222%22 fill=%22%236b7280%22/%3E%3Crect x=%22398%22 y=%22220%22 width=%222%22 height=%22100%22 fill=%22%236b7280%22/%3E%3C/svg%3E';

/**
 * Default thumbnail image (smaller than design image)
 */
export const DEFAULT_THUMBNAIL_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Cdefs%3E%3ClinearGradient id=%22thumb%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%23f3f4f6;stop-opacity:1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%23e5e7eb;stop-opacity:1%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22400%22 height=%22300%22 fill=%22url(%23thumb)%22/%3E%3C/svg%3E';

/**
 * Default values for forms
 */
export const DEFAULT_FORM_VALUES = {
  register: {
    username: '',
    email: '',
    password: '',
  },
  login: {
    email: '',
    password: '',
  },
  design: {
    title: '',
    description: '',
    imageUrl: DEFAULT_DESIGN_IMAGE,
    thumbnailUrl: DEFAULT_THUMBNAIL_IMAGE,
    cloudinaryId: '',
    category: 'UI/UX',
    tags: [],
  },
};

/**
 * API error messages (user-friendly)
 */
export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must be at least 6 characters',
  INVALID_USERNAME: 'Username must be at least 3 characters',
  PASSWORD_MISMATCH: 'Passwords do not match',
  USER_EXISTS: 'This email is already registered',
  USERNAME_EXISTS: 'This username is already taken',
  INVALID_CREDENTIALS: 'Email or password is incorrect',
  
  // Upload errors
  FILE_TOO_LARGE: 'Image must be less than 5MB',
  INVALID_FILE_TYPE: 'Only image files are allowed (JPG, PNG, GIF, WebP)',
  UPLOAD_FAILED: 'Failed to upload image. Please try again.',
  
  // Design errors
  DESIGN_NOT_FOUND: 'Design not found',
  INVALID_CATEGORY: 'Please select a valid category',
  TITLE_TOO_SHORT: 'Title must be at least 3 characters',
  
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
  
  // Generic
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};
