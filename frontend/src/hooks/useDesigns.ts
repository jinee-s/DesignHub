/**
 * useDesigns Hook
 * 
 * WHY: Encapsulate all design fetching logic
 * - Pagination state management
 * - Loading/error states
 * - Optimistic updates for like/save
 * - Prevent duplicate requests
 * 
 * Used by: HomePage, DesignDetailPage, ProfilePage
 */

import { useState, useCallback } from 'react';
import { designsAPI } from '../api';
import type { Design, DesignListResponse, GetDesignsParams } from '../api';

export function useDesigns(initialParams: GetDesignsParams = {}) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch designs with new parameters
  const fetchDesigns = useCallback(
    async (pageNum = 1, replace = true) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const response = await designsAPI.getAll({
          ...initialParams,
          page: pageNum,
          limit: 12,
        });

        // Filter out designs with missing essential data (title, _id)
        // Images can be handled by fallback placeholder in DesignCard
        const validDesigns = response.data.filter(
          (design) => design?._id && design?.title
        );

        if (replace) {
          setDesigns(validDesigns);
        } else {
          // Append for infinite scroll
          setDesigns((prev) => [...prev, ...validDesigns]);
        }

        setPage(pageNum);
        // If we got fewer designs than requested after filtering, we've reached the end
        setHasMore(validDesigns.length === 12);
      } catch (err) {
        setIsError(true);
        setError(err instanceof globalThis.Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [initialParams]
  );

  // Load next page (infinite scroll)
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchDesigns(page + 1, false);
    }
  }, [page, isLoading, hasMore, fetchDesigns]);

  // Optimistically update design (like/save)
  const updateDesign = useCallback(
    (designId: string, updates: Partial<Design>) => {
      setDesigns((prev) =>
        prev.map((design) =>
          design._id === designId ? { ...design, ...updates } : design
        )
      );
    },
    []
  );

  // Toggle like with optimistic update
  const toggleLike = useCallback(
    async (designId: string, currentLiked: boolean) => {
      // Optimistic update
      updateDesign(designId, {
        isLiked: !currentLiked,
        likes: currentLiked ? -1 : 1,
      } as any);

      try {
        await designsAPI.toggleLike(designId);
      } catch (err) {
        // Revert on error
        updateDesign(designId, {
          isLiked: currentLiked,
          likes: currentLiked ? 1 : -1,
        } as any);
        setError(err instanceof globalThis.Error ? err.message : String(err));
      }
    },
    [updateDesign]
  );

  // Toggle save with optimistic update
  const toggleSave = useCallback(
    async (designId: string, currentSaved: boolean) => {
      // Optimistic update
      updateDesign(designId, {
        isSaved: !currentSaved,
      } as any);

      try {
        await designsAPI.toggleSave(designId);
      } catch (err) {
        // Revert on error
        updateDesign(designId, {
          isSaved: currentSaved,
        } as any);
        setError(err instanceof globalThis.Error ? err.message : String(err));
      }
    },
    [updateDesign]
  );

  return {
    designs,
    isLoading,
    isError,
    error,
    page,
    hasMore,
    fetchDesigns,
    loadMore,
    updateDesign,
    toggleLike,
    toggleSave,
  };
}
