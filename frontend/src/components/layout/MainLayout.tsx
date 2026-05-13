/**
 * Main Layout Component
 * 
 * WHY: Similar to how Dribbble/Behance structure their app
 * - Persistent header/navigation
 * - Outlet for page content
 * - Footer for links
 * 
 * Used by: Almost every modern web app
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Professional Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-gradient-to-br from-pink-500 to-rose-600 rounded-md"></div>
                <h3 className="font-bold text-gray-950">CreativeHub</h3>
              </div>
              <p className="text-gray-600 text-sm">
                A platform for designers to showcase and discover design work.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Product</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Explore</a></li>
                <li><a href="#" className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Categories</a></li>
                <li><a href="#" className="text-gray-600 text-sm hover:text-gray-900 transition-colors">For Teams</a></li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Community</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Designers</a></li>
                <li><a href="#" className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Resources</a></li>
                <li><a href="#" className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 text-sm hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#" className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Privacy</a></li>
                <li><a href="#" className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs">
              © 2025 DesignHub. All rights reserved.
            </p>
            <div className="flex gap-6 text-gray-600 text-sm">
              <a href="#" className="hover:text-gray-900 transition-colors font-medium">Twitter</a>
              <a href="#" className="hover:text-gray-900 transition-colors font-medium">Instagram</a>
              <a href="#" className="hover:text-gray-900 transition-colors font-medium">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
