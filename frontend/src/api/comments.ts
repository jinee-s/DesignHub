import api from './client';
import type { User, Comment, CommentsResponse, CommentResponse } from './types';

// Re-export types for backward compatibility
export type { User, Comment, CommentsResponse, CommentResponse } from './types';

/**
 * Comments API Service
 * 
 * WHY: Similar to how YouTube/Medium handle comments
 * - Nested replies (threaded comments)
 * - Like comments
 * - Real-time feedback on designs
 */
export const commentsAPI = {
  /**
   * Get all comments for a design
   * Includes nested replies
   * Similar to: YouTube comment section
   */
  getByDesign: async (designId: string): Promise<CommentsResponse> => {
    return api.get(`/designs/${designId}/comments`);
  },

  /**
   * Add comment to design
   * Requires: Authentication
   */
  create: async (designId: string, content: string): Promise<CommentResponse> => {
    return api.post(`/designs/${designId}/comments`, { content });
  },

  /**
   * Add reply to comment
   * Requires: Authentication
   * Similar to: Twitter thread replies
   */
  reply: async (designId: string, content: string, parentId: string): Promise<CommentResponse> => {
    return api.post(`/designs/${designId}/comments`, { content, parentId });
  },

  /**
   * Update comment
   * Requires: Authentication + Ownership
   */
  update: async (commentId: string, content: string): Promise<CommentResponse> => {
    return api.put(`/comments/${commentId}`, { content });
  },

  /**
   * Delete comment
   * Requires: Authentication + Ownership
   * Also deletes all replies
   */
  delete: async (commentId: string): Promise<{ success: boolean }> => {
    return api.delete(`/comments/${commentId}`);
  },

  /**
   * Toggle like on comment
   * Requires: Authentication
   */
  toggleLike: async (commentId: string): Promise<{ success: boolean; data: { liked: boolean; likesCount: number } }> => {
    return api.post(`/comments/${commentId}/like`);
  },
};
