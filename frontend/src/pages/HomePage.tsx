import React, { useEffect } from 'react';
import { useDesigns, useInfiniteScroll } from '../hooks';
import { DesignCard } from '../components/DesignCard';
import { Loading, EmptyStates, Button } from '../components/ui';

/**
 * HomePage - Main feed for discovering designs
 * 
 * Features:
 * - Infinite scroll pagination (loads 12 designs at a time)
 * - Optimistic like/save updates
 * - Skeleton loading for perceived performance
 * - Error recovery with retry button
 * - Accessible ARIA labels and semantic HTML
 * - Responsive grid (1-4 columns based on screen size)
 * 
 * Performance:
 * - Intersection Observer for scroll detection (not scroll event listeners)
 * - React.memo on DesignCard prevents unnecessary re-renders
 * - Lazy loading images via Cloudinary
 * 
 * Accessibility:
 * - Semantic HTML (main, section, article)
 * - ARIA labels for interactive elements
 * - Keyboard navigation supported
 * - Focus management
 */
export function HomePage() {
  const { designs, isLoading, isError, error, hasMore, fetchDesigns, loadMore, toggleLike, toggleSave } = useDesigns();
  const observerTarget = useInfiniteScroll(loadMore, { hasMore, isLoading });

  // Load initial designs on mount
  useEffect(() => {
    fetchDesigns(1, true);
  }, []);

  // Retry loading designs if error occurred
  const handleRetry = () => {
    fetchDesigns(1, true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Section - Minimal Premium */}
      <section className="border-b border-gray-100 py-24 md:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-7xl md:text-8xl font-bold text-gray-950 mb-8 leading-tight tracking-tight">
              Design inspiration,<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">curated daily</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed font-light">
              Discover amazing work from the world's best designers. Share your creative process and get feedback.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="search-pill">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search designs, designers..." 
                  className="flex-1 bg-transparent outline-none text-base placeholder-gray-400"
                  aria-label="Search designs"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              <button className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-gray-950 hover:bg-gray-800 transition-colors">
                All work
              </button>
              {['UI Design', 'Web', 'Illustration', 'Branding', 'Animation'].map((category) => (
                <button 
                  key={category}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Error State */}
      {isError && (
        <section className="py-24 px-4" role="alert" aria-live="assertive">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-950 mb-2">Unable to load designs</h2>
            <p className="text-gray-600 mb-8">{error || 'Something went wrong. Please try again.'}</p>
            <Button onClick={handleRetry} variant="primary">
              Try Again
            </Button>
          </div>
        </section>
      )}

      {/* Loading State - Skeleton Grid */}
      {isLoading && designs.length === 0 && (
        <section className="py-12 px-4" role="status" aria-label="Loading designs">
          <div className="max-w-7xl mx-auto">
            <Loading variant="skeleton" count={12} />
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && designs.length === 0 && !isError && (
        <section className="py-32 px-4">
          <EmptyStates.NoDesigns />
        </section>
      )}

      {/* Design Grid Section */}
      {designs.length > 0 && (
        <section className="py-20 md:py-32 px-4" aria-label="Design gallery">
          <div className="max-w-7xl mx-auto">
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              role="region" 
              aria-label="Design cards grid"
            >
              {designs.map((design) => (
                <DesignCard
                  key={design._id}
                  design={design}
                  onLike={toggleLike}
                  onSave={toggleSave}
                />
              ))}
            </div>

            {/* Infinite Scroll Trigger & Loading */}
            <div 
              ref={observerTarget} 
              className="mt-24 py-16 text-center"
              role="status"
              aria-live="polite"
              aria-label={isLoading && hasMore ? 'Loading more designs' : undefined}
            >
              {isLoading && hasMore && (
                <div className="space-y-4">
                  <Loading variant="spinner" />
                  <p className="text-gray-600 text-sm">Loading more designs...</p>
                </div>
              )}
              {!hasMore && designs.length > 0 && (
                <div className="space-y-3">
                  <p className="text-gray-950 font-semibold">No more designs to load</p>
                  <p className="text-sm text-gray-500">You've reached the end of the feed</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
