import api from './client';
import type { User, LoginCredentials, RegisterData, AuthResponse } from './types';

// Re-export types for backward compatibility
export type { User, LoginCredentials, RegisterData, AuthResponse } from './types';

/**
 * Authentication API Service
 * 
 * WHY: Centralized auth logic similar to how Dribbble/GitHub authenticate users
 * - Single source of truth for authentication
 * - Easy to update auth logic in one place
 * - Type-safe API calls
 */
export const authAPI = {
  /**
   * Register a new user
   * Returns: JWT token + user data
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return api.post('/auth/register', data);
  },

  /**
   * Login existing user
   * Returns: JWT token + user data
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return api.post('/auth/login', credentials);
  },

  /**
   * Get current logged-in user
   * Requires: Valid JWT token
   */
  getCurrentUser: async (): Promise<{ success: boolean; data: User }> => {
    return api.get('/auth/me');
  },

  /**
   * Logout user (client-side only)
   * Clears token from localStorage
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
