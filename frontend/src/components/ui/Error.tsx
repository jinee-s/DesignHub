/**
 * Error Component
 * 
 * WHY: Similar to how Stripe/Linear handle errors
 * - User-friendly error messages
 * - Clear action buttons (retry, go back)
 * - Different error types (404, 500, network)
 * - Doesn't scare users with technical jargon
 * 
 * Used by: Stripe (friendly error pages), GitHub (404 page), Vercel (error boundaries)
 */

import React from 'react';

interface ErrorProps {
  title?: string;
  message?: string;
  type?: '404' | '500' | 'network' | 'custom';
  onRetry?: () => void;
  showBackButton?: boolean;
}

export function Error({ 
  title, 
  message, 
  type = 'custom',
  onRetry,
  showBackButton = true 
}: ErrorProps) {
  // Predefined error messages for common scenarios
  const errorConfig = {
    '404': {
      title: 'Design Not Found',
      message: 'The design you\'re looking for doesn\'t exist or has been removed.',
      icon: '🔍',
    },
    '500': {
      title: 'Something Went Wrong',
      message: 'Our servers encountered an error. We\'ve been notified and are working on it.',
      icon: '😕',
    },
    'network': {
      title: 'Connection Error',
      message: 'Please check your internet connection and try again.',
      icon: '📡',
    },
    'custom': {
      title: title || 'Oops!',
      message: message || 'Something unexpected happened.',
      icon: '⚠️',
    },
  };

  const config = errorConfig[type];

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
      {/* Icon */}
      <div className="text-6xl mb-4">{config.icon}</div>
      
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {config.title}
      </h2>
      
      {/* Message */}
      <p className="text-gray-600 max-w-md mb-6">
        {config.message}
      </p>
      
      {/* Actions */}
      <div className="flex gap-3">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="btn btn-primary"
          >
            Try Again
          </button>
        )}
        
        {showBackButton && (
          <button 
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Error Boundary Fallback Component
 * Used with React Error Boundary to catch crashes
 */
export function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">💥</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Application Error
        </h2>
        <p className="text-gray-600 mb-4">
          The application encountered an unexpected error. This has been logged.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-4">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Error details (dev only)
            </summary>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </details>
        )}
        <button 
          onClick={resetErrorBoundary}
          className="btn btn-primary w-full"
        >
          Reload Application
        </button>
      </div>
    </div>
  );
}
