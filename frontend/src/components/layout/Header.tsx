/**
 * Header Component
 * 
 * Modern minimal navigation header with:
 * - Clean logo/branding
 * - Search bar (md+)
 * - User authentication menu
 * - Upload button (when auth)
 * - Responsive design
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Search (md+) - Left */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="search-pill w-full">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search designs..." 
                className="bg-transparent outline-none flex-1 text-sm placeholder-gray-400"
                aria-label="Search designs"
              />
            </div>
          </div>

          {/* Right Navigation - Top Right Corner */}
          <nav className="flex items-center gap-4 ml-auto">
            {isAuthenticated ? (
              <>
                {/* Role-specific actions */}
                {user?.role === 'designer' ? (
                  <>
                    <Link to="/create" className="hidden sm:inline">
                      <Button size="sm" variant="primary">
                        + Upload Design
                      </Button>
                    </Link>
                  </>
                ) : null}

                {/* User Info Section - Username + Avatar + Admin Badge */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {/* Username */}
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                    {user?.role === 'admin' && (
                      <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded mt-1 inline-block">
                        ADMIN
                      </span>
                    )}
                  </div>

                  {/* Avatar & Logo */}
                  <Link 
                    to={`/profile/${user?.username}`} 
                    className="flex items-center gap-2"
                  >
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.username} 
                        className="w-9 h-9 rounded-lg object-cover" 
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-sm font-bold">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    {/* Logo on right */}
                    <div className="hidden md:flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white bg-gradient-to-br from-pink-500 to-rose-600 hover:shadow-lg transition-all duration-200">
                        D
                      </div>
                      <span className="font-bold text-gray-950 text-sm">Hub</span>
                    </div>
                  </Link>
                </div>

                {/* Logout Button */}
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-700"
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                {/* Logo - Unauthenticated */}
                <Link to="/" className="flex items-center gap-2 shrink-0 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white bg-gradient-to-br from-pink-500 to-rose-600 group-hover:shadow-lg transition-all duration-200">
                    D
                  </div>
                  <span className="font-bold text-gray-950 hidden sm:inline">DesignHub</span>
                </Link>

                {/* Sign Up Button */}
                <Link to="/register" className="hidden sm:inline">
                  <Button variant="ghost" size="sm">
                    Sign up
                  </Button>
                </Link>

                {/* Login Button */}
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    Log in
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Indicator */}
            {isAuthenticated && (
              <Link to={`/profile/${user?.username}`} className="md:hidden">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.username} 
                    className="w-8 h-8 rounded-lg object-cover hover:shadow transition-shadow" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-sm font-bold">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
