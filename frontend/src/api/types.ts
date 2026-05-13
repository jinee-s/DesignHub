/**
 * Shared Type Definitions
 * 
 * Central location for all API types to avoid circular dependencies
 */

// User Types
export type UserRole = 'designer' | 'client' | 'admin';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  designCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

// Design Types
export interface Design {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  cloudinaryId: string;
  category: string;
  tags: string[];
  user: User | string;
  likes: number;
  likedBy?: string[];
  isLiked?: boolean;
  views: number;
  saves: number;
  savedBy?: string[];
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignListResponse {
  success: boolean;
  data: Design[];
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  message?: string;
}

export interface CreateDesignData {
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl: string;
  cloudinaryId: string;
  category: string;
  tags?: string[];
}

export interface GetDesignsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: 'newest' | 'popular' | 'trending';
}

// Comment Types
export interface Comment {
  _id: string;
  content: string;
  user: User | string;
  designId: string;
  parentId?: string;
  replies?: Comment[];
  likes: number;
  likedBy?: string[];
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  success: boolean;
  data: Comment[];
}

export interface CommentResponse {
  success: boolean;
  data: Comment;
}

// Upload Types
export interface UploadData {
  imageUrl: string;
  thumbnailUrl: string;
  cloudinaryId: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  originalName?: string;
}

export interface UploadResponse {
  success: boolean;
  data: UploadData;
  message?: string;
}

// Single design response wrapper
export interface DesignResponse {
  success: boolean;
  data: Design;
  message?: string;
}
