/**
 * Loading Component
 * 
 * WHY: Similar to Dribbble/Pinterest loading states
 * - Skeleton screens reduce perceived loading time
 * - Better UX than blank pages or spinners
 * - Users see something immediately
 * 
 * Used by: LinkedIn (skeleton cards), Facebook (ghost content), Pinterest (loading pins)
 */

import React from 'react';

interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'fullscreen';
  count?: number;
}

export function Loading({ variant = 'skeleton', count = 3 }: LoadingProps) {
  // Fullscreen loader - Used during initial app load
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading CreativeHub...</p>
        </div>
      </div>
    );
  }

  // Simple spinner - Used for buttons and small components
  if (variant === 'spinner') {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Skeleton cards - Used for design grid (better UX)
  return (
    <div className="design-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden animate-pulse">
          {/* Image skeleton */}
          <div className="w-full h-64 bg-gray-200"></div>
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            
            {/* User info skeleton */}
            <div className="flex items-center gap-2 pt-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
