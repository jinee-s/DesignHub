/**
 * DesignerDashboard
 * 
 * Premium dashboard for designers showing:
 * - Upload new design button
 * - My designs (portfolio)
 * - Stats (views, likes, saves)
 * - Earnings/engagement metrics
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

export function DesignerDashboard() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="border-b border-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-950 mb-2">Designer Dashboard</h1>
              <p className="text-gray-600">Manage your portfolio and track engagement</p>
            </div>
            <Link to="/create">
              <Button variant="primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Design
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">My Designs</p>
              <p className="text-3xl font-bold text-gray-950">{user?.designCount || 0}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">Total Likes</p>
              <p className="text-3xl font-bold text-pink-600">0</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">Total Views</p>
              <p className="text-3xl font-bold text-blue-600">0</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">Followers</p>
              <p className="text-3xl font-bold text-green-600">{user?.followers || 0}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Area */}
      <section className="py-12 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-950 mb-4">Your portfolio is empty</h2>
            <p className="text-gray-600 mb-8">Upload your first design to get started</p>
            <Link to="/create">
              <Button variant="primary" size="lg">
                Upload Your First Design
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
