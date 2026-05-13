import api from './client';
import type {
  User,
  Design,
  DesignListResponse,
  DesignResponse,
  CreateDesignData,
  GetDesignsParams,
} from './types';

// Re-export types for backward compatibility
export type {
  User,
  Design,
  DesignListResponse,
  CreateDesignData,
  GetDesignsParams,
} from './types';

// Type definitions are now in ./types.ts

/**
 * Designs API Service
 * 
 * WHY: Similar to how Pinterest/Dribbble organize their content APIs
 * - Centralized design management
 * - Pagination support (infinite scroll)
 * - Search and filtering
 * - Like/save functionality
 */
export const designsAPI = {
  /**
   * Get paginated list of designs
   * Similar to: Pinterest feed, Dribbble shots
   */
  getAll: async (params: GetDesignsParams = {}): Promise<DesignListResponse> => {
    return api.get('/designs', { params });
  },

  /**
   * Get single design by ID
   * Similar to: Dribbble shot detail page
   */
  getById: async (id: string): Promise<DesignResponse> => {
    return api.get(`/designs/${id}`);
  },

  /**
   * Create new design
   * Requires: Authentication
   * Similar to: Dribbble "Upload shot" feature
   */
  create: async (data: CreateDesignData): Promise<DesignResponse> => {
    return api.post('/designs', data);
  },

  /**
   * Update existing design
   * Requires: Authentication + Ownership
   */
  update: async (id: string, data: Partial<CreateDesignData>): Promise<DesignResponse> => {
    return api.put(`/designs/${id}`, data);
  },

  /**
   * Delete design
   * Requires: Authentication + Ownership
   */
  delete: async (id: string): Promise<{ success: boolean }> => {
    return api.delete(`/designs/${id}`);
  },

  /**
   * Toggle like on design
   * Requires: Authentication
   * Similar to: Instagram/Dribbble like button
   * Returns: { liked: boolean, likesCount: number }
   */
  toggleLike: async (id: string): Promise<{ success: boolean; data: { liked: boolean; likesCount: number } }> => {
    return api.post(`/designs/${id}/like`);
  },

  /**
   * Toggle save on design
   * Requires: Authentication
   * Similar to: Pinterest save/collect feature
   * Returns: { saved: boolean, savesCount: number }
   */
  toggleSave: async (id: string): Promise<{ success: boolean; data: { saved: boolean; savesCount: number } }> => {
    return api.post(`/designs/${id}/save`);
  },
};
