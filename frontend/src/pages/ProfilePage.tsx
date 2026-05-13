import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDesigns } from '../hooks';
import { DesignCard } from '../components/DesignCard';
import { Loading, EmptyState, EmptyStates, Button } from '../components/ui';

type TabType = 'designs' | 'liked' | 'saved';

export function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('designs');
  
  // Load designs for different tabs
  const userDesigns = useDesigns();
  const likedDesigns = useDesigns();
  const savedDesigns = useDesigns();

  useEffect(() => {
    // Load designs on mount
    if (activeTab === 'designs') {
      userDesigns.fetchDesigns(1, true);
    } else if (activeTab === 'liked') {
      likedDesigns.fetchDesigns(1, true);
    } else if (activeTab === 'saved') {
      savedDesigns.fetchDesigns(1, true);
    }
  }, [activeTab]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-950 mb-2">You're not logged in</h2>
          <p className="text-gray-600 mb-8">Sign in to view your creator profile and designs</p>
          <Link to="/login">
            <Button variant="primary" fullWidth>
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'designs', label: 'Designs', count: user.designCount },
    { id: 'liked', label: 'Liked', count: 0 },
    { id: 'saved', label: 'Saved', count: 0 },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'designs':
        return userDesigns;
      case 'liked':
        return likedDesigns;
      case 'saved':
        return savedDesigns;
    }
  };

  const activeData = getActiveData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Profile Header - Minimal Professional */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex flex-col md:flex-row items-start gap-10 md:gap-12">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username}
                  className="w-32 h-32 rounded-2xl object-cover shadow-sm border border-gray-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-sm">
                  <span className="text-5xl font-bold text-white">{user.username[0].toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-950 mb-3 tracking-tight">{user.username}</h1>
              <p className="text-lg text-gray-600 mb-2">{user.email}</p>
              {user.bio && <p className="text-gray-700 leading-relaxed max-w-2xl mb-10 text-base">{user.bio}</p>}

              {/* Stats */}
              <div className="flex items-center gap-10 md:gap-16">
                <div className="flex flex-col">
                  <p className="text-4xl md:text-5xl font-bold text-gray-950">{user.designCount || 0}</p>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Designs</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-4xl md:text-5xl font-bold text-gray-950">{user.followers || 0}</p>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Followers</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-4xl md:text-5xl font-bold text-gray-950">{user.following || 0}</p>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Following</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 space-y-3 w-full md:w-auto">
              <Link to="/create" className="block">
                <Button variant="primary" size="md" fullWidth>
                  + Upload Design
                </Button>
              </Link>
              <button className="w-full px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors duration-200">
                Edit Profile
              </button>
              <button className="w-full px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors duration-200">
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section - Improved Styling */}
      <div className="border-b border-gray-200 bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 md:gap-12">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 font-semibold text-sm md:text-base transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-pink-600 text-gray-950'
                    : 'border-transparent text-gray-600 hover:text-gray-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeData.isLoading && activeData.designs.length === 0 ? (
          <div className="py-12">
            <Loading variant="skeleton" count={12} />
          </div>
        ) : activeData.designs.length === 0 ? (
          <EmptyStates.NoDesigns />
        ) : (
          <>
            <section className="py-20 md:py-28 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {activeData.designs.map((design) => (
                    <DesignCard
                      key={design._id}
                      design={design}
                      onLike={activeData.toggleLike}
                      onSave={activeData.toggleSave}
                    />
                  ))}
                </div>

                {/* Load More */}
                {activeData.hasMore && !activeData.isLoading && (
                  <div className="mt-16 text-center">
                    <Button 
                      onClick={activeData.loadMore}
                      variant="outline"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            </section></>
        )}
      </div>
    </div>
  );
}
