/**
 * Empty State Component
 * 
 * WHY: Similar to how Notion/Figma handle empty states
 * - Guides users on what to do next
 * - Reduces confusion and abandonment
 * - Provides clear call-to-action
 * - Makes app feel alive (not broken)
 * 
 * Used by: Notion (empty pages), Figma (no files), Dribbble (no shots), GitHub (no repos)
 */

import React from 'react';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact';
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{description}</p>
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn btn-primary mt-3">
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
      {/* Icon */}
      <div className="text-6xl mb-4">
        {typeof icon === 'string' ? icon : icon}
      </div>
      
      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 max-w-md mb-6">
        {description}
      </p>
      
      {/* Action button */}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Predefined empty states for common scenarios
 * Saves time and ensures consistency
 */

export const EmptyStates = {
  NoDesigns: ({ onUpload }: { onUpload?: () => void }) => (
    <EmptyState
      icon="🎨"
      title="No Designs Yet"
      description="Start showcasing your work by uploading your first design."
      actionLabel="Upload Design"
      onAction={onUpload}
    />
  ),

  NoResults: ({ searchQuery }: { searchQuery?: string }) => (
    <EmptyState
      icon="🔍"
      title="No Results Found"
      description={
        searchQuery 
          ? `No designs match "${searchQuery}". Try different keywords.`
          : "No designs match your filters. Try adjusting your search."
      }
    />
  ),

  NoComments: () => (
    <EmptyState
      icon="💬"
      title="No Comments Yet"
      description="Be the first to share your thoughts on this design."
      variant="compact"
    />
  ),

  NoSavedDesigns: () => (
    <EmptyState
      icon="🔖"
      title="No Saved Designs"
      description="Start building your collection by saving designs you love."
    />
  ),

  NotAuthenticated: ({ onLogin }: { onLogin: () => void }) => (
    <EmptyState
      icon="🔒"
      title="Login Required"
      description="Please login to access this feature and start exploring amazing designs."
      actionLabel="Login"
      onAction={onLogin}
    />
  ),
};
