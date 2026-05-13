/**
 * Response Validation & Type Guards
 * 
 * Validates API responses match expected shapes
 * Prevents runtime errors from schema misalignments
 */

import type { 
  AuthResponse, 
  UploadResponse, 
  DesignResponse, 
  DesignListResponse 
} from '../api/types';

/**
 * Validate authentication response has required fields
 */
export function validateAuthResponse(data: unknown): data is AuthResponse {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as any;
  return (
    typeof obj.success === 'boolean' &&
    typeof obj.token === 'string' &&
    obj.token.length > 0 &&
    typeof obj.user === 'object' &&
    obj.user !== null &&
    typeof obj.user._id === 'string' &&
    typeof obj.user.email === 'string' &&
    typeof obj.user.username === 'string'
  );
}

/**
 * Validate upload response has required fields
 */
export function validateUploadResponse(data: unknown): data is UploadResponse {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as any;
  return (
    typeof obj.success === 'boolean' &&
    typeof obj.data === 'object' &&
    obj.data !== null &&
    typeof obj.data.imageUrl === 'string' &&
    typeof obj.data.thumbnailUrl === 'string' &&
    typeof obj.data.cloudinaryId === 'string' &&
    obj.data.imageUrl.length > 0 &&
    obj.data.thumbnailUrl.length > 0 &&
    obj.data.cloudinaryId.length > 0
  );
}

/**
 * Validate design response has required fields
 */
export function validateDesignResponse(data: unknown): data is DesignResponse {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as any;
  return (
    typeof obj.success === 'boolean' &&
    typeof obj.data === 'object' &&
    obj.data !== null &&
    typeof obj.data._id === 'string' &&
    typeof obj.data.title === 'string' &&
    typeof obj.data.imageUrl === 'string'
  );
}

/**
 * Validate design list response has required fields
 */
export function validateDesignListResponse(data: unknown): data is DesignListResponse {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as any;
  return (
    typeof obj.success === 'boolean' &&
    Array.isArray(obj.data) &&
    obj.data.every((item: any) => 
      typeof item._id === 'string' &&
      typeof item.title === 'string'
    )
  );
}

/**
 * Safe response data extraction with fallbacks
 */
export function extractAuthData(response: any) {
  if (validateAuthResponse(response)) {
    return response;
  }
  
  // Try to extract from unexpected response shape
  console.warn('Auth response shape mismatch, attempting recovery:', response);
  
  if (response?.data) {
    if (validateAuthResponse(response.data)) {
      return response.data;
    }
    if (response.data.token && response.data.user) {
      return {
        success: response.success ?? true,
        token: response.data.token,
        user: response.data.user
      };
    }
  }
  
  throw new Error('Invalid auth response format');
}

/**
 * Safe upload response data extraction
 */
export function extractUploadData(response: any) {
  if (validateUploadResponse(response)) {
    return response;
  }
  
  // Try to extract from unexpected response shape
  console.warn('Upload response shape mismatch, attempting recovery:', response);
  
  if (response?.data) {
    if (validateUploadResponse(response)) {
      return response;
    }
  }
  
  throw new Error('Invalid upload response format');
}

/**
 * Safe design response data extraction
 */
export function extractDesignData(response: any) {
  if (validateDesignResponse(response)) {
    return response;
  }
  
  // Try to extract from unexpected response shape
  console.warn('Design response shape mismatch, attempting recovery:', response);
  
  if (response?.data && response.data._id) {
    return {
      success: response.success ?? true,
      data: response.data
    };
  }
  
  throw new Error('Invalid design response format');
}

/**
 * Safe design list response data extraction
 */
export function extractDesignListData(response: any) {
  if (validateDesignListResponse(response)) {
    return response;
  }
  
  // Try to extract from unexpected response shape
  console.warn('Design list response shape mismatch, attempting recovery:', response);
  
  if (Array.isArray(response)) {
    return {
      success: true,
      data: response
    };
  }
  
  if (response?.data && Array.isArray(response.data)) {
    return response;
  }
  
  throw new Error('Invalid design list response format');
}
