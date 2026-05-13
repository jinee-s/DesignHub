import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { designsAPI } from '../api';
import { Loading, Error } from '../components/ui';
import type { Design } from '../api';

export function DesignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [design, setDesign] = useState<Design | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchDesign = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await designsAPI.getById(id);
        setDesign(response.data);
      } catch (err) {
        setIsError(true);
        setError(err instanceof globalThis.Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesign();
  }, [id]);

  const handleLike = async () => {
    if (!design) return;
    
    const wasLiked = design.isLiked;
    
    // Optimistic update
    setDesign({
      ...design,
      isLiked: !wasLiked,
      likes: design.likes + (wasLiked ? -1 : 1),
    });

    try {
      await designsAPI.toggleLike(design._id);
    } catch (err) {
      // Revert on error
      setDesign({
        ...design,
        isLiked: wasLiked,
        likes: design.likes + (wasLiked ? 1 : -1),
      });
      setError(err instanceof globalThis.Error ? err.message : String(err));
    }
  };

  const handleSave = async () => {
    if (!design) return;
    
    const wasSaved = design.isSaved;
    
    // Optimistic update
    setDesign({
      ...design,
      isSaved: !wasSaved,
      saves: design.saves + (wasSaved ? -1 : 1),
    });

    try {
      await designsAPI.toggleSave(design._id);
    } catch (err) {
      // Revert on error
      setDesign({
        ...design,
        isSaved: wasSaved,
        saves: design.saves + (wasSaved ? 1 : -1),
      });
      setError(err instanceof globalThis.Error ? err.message : String(err));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading variant="skeleton" count={1} />
      </div>
    );
  }

  if (isError || !design) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Error type="404" message={error || 'Design not found'} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Header with back button */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-950 transition-colors font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Image */}
          <div className="lg:col-span-2">
            <img
              src={design.imageUrl}
              alt={design.title}
              className="w-full rounded-2xl shadow-sm border border-gray-100 object-cover aspect-[4/3]"
            />
          </div>

          {/* Details Sidebar */}
          <div className="space-y-10">
            {/* Title & Description */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-950 mb-6 leading-tight tracking-tight">{design.title}</h1>
              <p className="text-lg text-gray-600 leading-relaxed font-light">{design.description}</p>
            </div>

            {/* Designer Info - Minimal Card */}
            <div className="border-t border-gray-100 pt-10">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">By</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex-shrink-0 shadow-sm border border-gray-100"></div>
                <div>
                  <p className="font-semibold text-gray-950 text-lg">
                    {typeof design.user === 'string' ? design.user : design.user?.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    {typeof design.user === 'string' ? '0' : design.user?.followers} followers
                  </p>
                </div>
              </div>
            </div>

            {/* Stats - Minimal Grid */}
            <div className="border-t border-gray-100 pt-10 grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-gray-950">{design.likes}</p>
                <p className="text-xs text-gray-600 mt-3 uppercase font-semibold tracking-widest">Likes</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-950">{design.saves}</p>
                <p className="text-xs text-gray-600 mt-3 uppercase font-semibold tracking-widest">Saves</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-950">{design.views}</p>
                <p className="text-xs text-gray-600 mt-3 uppercase font-semibold tracking-widest">Views</p>
              </div>
            </div>

            {/* Actions - Modern Button Styles */}
            <div className="border-t border-gray-100 pt-10 flex gap-4">
              <button
                onClick={handleLike}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  design.isLiked
                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-md'
                    : 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill={design.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {design.isLiked ? 'Liked' : 'Like'}
              </button>

              <button
                onClick={handleSave}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  design.isSaved
                    ? 'bg-pink-600 text-white hover:bg-pink-700 shadow-md'
                    : 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill={design.isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z" />
                </svg>
                {design.isSaved ? 'Saved' : 'Save'}
              </button>
            </div>

            {/* Tags */}
            {design.tags.length > 0 && (
              <div className="border-t border-gray-100 pt-8">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {design.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Category & Date */}
            <div className="border-t border-gray-100 pt-8 space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</p>
                <p className="text-gray-700 capitalize font-medium">{design.category}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Published</p>
                <p className="text-gray-700 font-medium">
                  {new Date(design.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
