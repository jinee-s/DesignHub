/**
 * ClientDashboard
 * 
 * Premium dashboard for clients showing:
 * - Browse designers
 * - Saved/bookmarked designs
 * - Hire/contact options
 * - Ongoing projects
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

export function ClientDashboard() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="border-b border-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-950 mb-2">Hiring Dashboard</h1>
            <p className="text-gray-600">Find and hire the best designers for your projects</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">Saved Designs</p>
              <p className="text-3xl font-bold text-gray-950">0</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">Favorite Designers</p>
              <p className="text-3xl font-bold text-pink-600">0</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">Active Projects</p>
              <p className="text-3xl font-bold text-blue-600">0</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">Messages</p>
              <p className="text-3xl font-bold text-green-600">0</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Area */}
      <section className="py-12 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-950 mb-8">Get started</h2>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Browse Designers Card */}
            <Link to="/" className="group">
              <div className="border-2 border-gray-200 rounded-xl p-8 hover:border-pink-500 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-950 mb-2">Browse Portfolio</h3>
                <p className="text-gray-600 mb-4">Explore designs from talented designers on CreativeHub</p>
                <span className="text-pink-600 font-semibold group-hover:gap-2 inline-flex items-center gap-1 transition-all">
                  Explore now →
                </span>
              </div>
            </Link>

            {/* How It Works Card */}
            <div className="border-2 border-gray-200 rounded-xl p-8">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-950 mb-2">How It Works</h3>
              <ol className="text-gray-600 space-y-2 text-sm">
                <li><strong>1. Browse</strong> portfolios of creative designers</li>
                <li><strong>2. Connect</strong> with designers that match your vision</li>
                <li><strong>3. Collaborate</strong> on your design projects</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
