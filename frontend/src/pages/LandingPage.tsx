/**
 * LandingPage - Role Selection
 * 
 * Entry point for new users to choose their role:
 * - "I'm a Designer" (designer) → Can upload designs and build portfolio
 * - "I'm Hiring" (client) → Can browse and hire designers
 * 
 * Design: Minimal, two-choice CTA style (like Stripe, TypeForm)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import type { UserRole } from '../api';

export function LandingPage() {
  const navigate = useNavigate();
  const { setTempRole } = useAuth();

  const handleRoleSelect = (role: UserRole) => {
    // ✅ Store the selected role temporarily
    setTempRole(role);
    // ✅ Redirect to signup with role pre-selected
    navigate('/register');
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="border-b border-gray-100 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-950 mb-6 leading-tight">
            Welcome to CreativeHub
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Connect designers with clients. Build your portfolio or find your next project.
          </p>
        </div>
      </section>

      {/* Role Selection */}
      <section className="py-24 md:py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Designer Card */}
            <button
              onClick={() => handleRoleSelect('designer')}
              className="group text-left"
            >
              <div className="border-2 border-gray-200 rounded-2xl p-8 md:p-12 transition-all duration-300 hover:border-pink-500 hover:shadow-lg hover:scale-[1.02]">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center mb-6 group-hover:bg-pink-200 transition-colors">
                  <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold text-gray-950 mb-3">I'm a Designer</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Showcase your work, build your portfolio, and get hired by clients looking for creative talent.
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Upload and showcase designs
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Build your creator profile
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Connect with hiring clients
                  </li>
                </ul>

                {/* CTA */}
                <Button 
                  fullWidth
                  variant="primary"
                  className="group-hover:scale-105"
                >
                  Get Started as Designer →
                </Button>
              </div>
            </button>

            {/* Client Card */}
            <button
              onClick={() => handleRoleSelect('client')}
              className="group text-left"
            >
              <div className="border-2 border-gray-200 rounded-2xl p-8 md:p-12 transition-all duration-300 hover:border-blue-500 hover:shadow-lg hover:scale-[1.02]">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold text-gray-950 mb-3">I'm Hiring</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Browse talented designers, find the perfect creative match for your project, and hire directly.
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Browse curated portfolio designs
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Contact and hire designers
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Build a dream team
                  </li>
                </ul>

                {/* CTA */}
                <Button 
                  fullWidth
                  variant="primary"
                  className="group-hover:scale-105"
                >
                  Start Hiring →
                </Button>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Already have account */}
      <section className="py-12 px-4 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-pink-600 font-semibold hover:text-pink-700 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
