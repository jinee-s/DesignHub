/**
 * DesignCard Component
 * 
 * Production-ready design card with:
 * - Clean image display with error fallback placeholder
 * - Defensive rendering (optional chaining, null checks)
 * - User info and stats with proper fallbacks
 * - Like/save interactions with auth checks
 * - Smooth transitions and hover animations (scale 1.02, shadow increase)
 * - Responsive sizing and fixed aspect ratio
 * - Image lazy loading and optimization
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_DESIGN_IMAGE } from '../constants/placeholders';
import type { Design } from '../api';

interface DesignCardProps {
  design: Design;
  onLike?: (designId: string, isLiked: boolean) => void;
  onSave?: (designId: string, isSaved: boolean) => void;
}

export function DesignCard({ design, onLike, onSave }: DesignCardProps) {
  const { isAuthenticated } = useAuth();
  const [imageError, setImageError] = useState(false);

  // Validate card data - skip rendering if essential data is missing
  if (!design?._id || !design?.title) {
    return null;
  }

  // Get safe fallback values using optional chaining
  const title = design.title?.trim() || 'Untitled Design';
  const username = typeof design.user === 'string' ? design.user : design.user?.username || 'Designer';
  const userInitial = username.charAt(0).toUpperCase() || 'D';
  const likes = design.likes ?? 0;
  const views = design.views ?? 0;
  const isLiked = design.isLiked ?? false;
  const isSaved = design.isSaved ?? false;
  
  // Use placeholder if no imageUrl or image failed to load
  const displayImageUrl = !design.imageUrl || imageError ? DEFAULT_DESIGN_IMAGE : design.imageUrl;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    onLike?.(design._id, isLiked);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    onSave?.(design._id, isSaved);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Link to={`/design/${design._id}`} className="group block">
      <article className="overflow-hidden bg-white rounded-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gray-200 shadow-sm">
        {/* Image Container with Hover Effect */}
        <div className="relative overflow-hidden bg-gray-50 aspect-[4/3]">
          <img 
            src={displayImageUrl}
            alt={title}
            loading="lazy" 
            decoding="async" 
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Action Overlay (on hover) - only show if authenticated */}
          {isAuthenticated && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={handleLike}
                className="p-3 rounded-lg bg-white/90 hover:bg-white transition-all m-2 hover:shadow-lg"
                aria-label={isLiked ? 'Unlike design' : 'Like design'}
              >
                <svg 
                  className={`w-5 h-5 transition-all ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              </button>
              <button
                onClick={handleSave}
                className="p-3 rounded-lg bg-white/90 hover:bg-white transition-all m-2 hover:shadow-lg"
                aria-label={isSaved ? 'Unsave design' : 'Save design'}
              >
                <svg 
                  className={`w-5 h-5 transition-all ${isSaved ? 'fill-pink-500 text-pink-500' : 'text-gray-700'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Card Content - Minimal Clean Layout */}
        <div className="p-5 space-y-4">
          {/* Title - Truncated for consistency */}
          <h3 className="font-medium text-gray-950 text-lg line-clamp-2 group-hover:text-pink-600 transition-colors tracking-tight leading-snug">
            {title}
          </h3>

          {/* User Info & Stats - Responsive Layout */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* User Avatar & Name */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {userInitial}
              </div>
              <p className="text-sm font-medium text-gray-700 truncate">
                {username}
              </p>
            </div>

            {/* Stats - Icons only for compact view */}
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
              <div 
                className="flex items-center gap-1.5 hover:text-rose-600 transition-colors cursor-default"
                title={`${likes} likes`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                <span className="font-semibold text-gray-700">{likes}</span>
              </div>
              <div 
                className="flex items-center gap-1.5 hover:text-sky-600 transition-colors cursor-default"
                title={`${views} views`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-gray-700">{views}</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
