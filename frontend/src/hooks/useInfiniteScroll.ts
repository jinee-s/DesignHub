/**
 * useInfiniteScroll Hook
 * 
 * WHY: Automatic pagination when user scrolls to bottom
 * - Detects scroll position using Intersection Observer
 * - Triggers loadMore callback when user reaches threshold
 * - Prevents duplicate requests
 * - More efficient than polling
 * 
 * Used by: HomePage (design grid infinite scroll)
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number; // pixels from bottom to trigger
}

export function useInfiniteScroll(
  onLoadMore: () => void,
  { hasMore, isLoading, threshold = 500 }: UseInfiniteScrollOptions
) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      // When user scrolls near the bottom and we have more data to load
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    // Create Intersection Observer to detect when scroll target is visible
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`, // Start loading before user reaches absolute bottom
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleIntersection, threshold]);

  return observerTarget;
}
