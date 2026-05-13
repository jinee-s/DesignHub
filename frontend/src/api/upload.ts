import api from './client';
import type { UploadResponse } from './types';

// Re-export types for backward compatibility
export type { UploadResponse } from './types';

/**
 * Upload API Service
 * 
 * WHY: Similar to how Dribbble/Behance handle image uploads
 * - Direct upload to cloud storage (Cloudinary)
 * - Automatic thumbnail generation
 * - Progress tracking support
 * - File validation on client side
 */
export const uploadAPI = {
  /**
   * Upload image to Cloudinary
   * Requires: Authentication
   * 
   * Client-side validation:
   * - Max file size: 5MB (prevents slow uploads)
   * - Allowed formats: jpg, png, gif, webp
   * 
   * Similar to: Dribbble shot upload, Instagram photo upload
   */
  image: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
    // Client-side validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedFormats.includes(file.type)) {
      throw new Error('Invalid file format. Allowed: JPG, PNG, GIF, WebP');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Upload with progress tracking
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });

      // `api` interceptor returns `response.data`, but TypeScript may still
      // infer a generic axios response type. Cast to `UploadResponse`.
      return response as unknown as UploadResponse;
    } catch (error: any) {
      // Extract meaningful error message
      const errorMessage = 
        error?.message?.message || // AWS/Axios error format
        error?.data?.message || // Backend error message
        error?.message || // Standard error message
        'Failed to upload image. Please try again.';
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Validate file before upload
   * Prevents unnecessary API calls
   */
  validateFile: (file: File): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 5MB limit' };
    }

    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedFormats.includes(file.type)) {
      return { valid: false, error: 'Invalid file format. Allowed: JPG, PNG, GIF, WebP' };
    }

    return { valid: true };
  },
};
