/**
 * API Service Layer
 * 
 * Centralized API management similar to enterprise applications
 * 
 * WHY THIS PATTERN:
 * - Single import point: import { authAPI, designsAPI } from '@/api'
 * - Easy to mock for testing
 * - Type-safe with TypeScript
 * - Consistent error handling
 * - Easy to add new features (webhooks, analytics, etc.)
 * 
 * Used by: Airbnb, Stripe, GitHub, Linear
 */

export { authAPI } from './auth';
export { designsAPI } from './designs';
export { commentsAPI } from './comments';
export { uploadAPI } from './upload';

// Re-export all types from central location
export type {
  User,
  UserRole,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  Design,
  DesignListResponse,
  CreateDesignData,
  GetDesignsParams,
  Comment,
  CommentsResponse,
  CommentResponse,
  UploadResponse,
} from './types';
