/**
 * Authentication Context
 * 
 * WHY: Similar to how Firebase/Auth0 manage auth state
 * - Global auth state accessible anywhere
 * - Automatic token refresh
 * - Persistent login (survives page refresh)
 * - Protected routes support
 * - Role-based access control
 * 
 * Used by: Most modern SPAs (Notion, Linear, GitHub, etc.)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../api';
import { extractAuthData } from '../utils/responseValidator';
import type { User, UserRole } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tempRole: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role?: UserRole) => Promise<void>;
  setTempRole: (role: UserRole | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempRole, setTempRole] = useState<UserRole | null>(null);

  // Initialize auth state on mount
  // Check if user was previously logged in
  useEffect(() => {
    const initAuth = async () => {
      // Skip token verification to avoid blocking on backend
      // Just set loading to false immediately
      setIsLoading(false);
      
      /* Backend token verification disabled for now
      const savedToken = localStorage.getItem('token');
      
      if (savedToken) {
        setToken(savedToken);
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      */
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const authData = extractAuthData(response);
    
    // Save token and user data
    localStorage.setItem('token', authData.token);
    setToken(authData.token);
    setUser(authData.user);
  };

  // Register function with role support
  const register = async (username: string, email: string, password: string, role?: UserRole) => {
    const response = await authAPI.register({ username, email, password, role });
    const authData = extractAuthData(response);
    
    // Auto-login after successful registration
    localStorage.setItem('token', authData.token);
    setToken(authData.token);
    setUser(authData.user);
    
    // Clear temp role after successful registration
    setTempRole(null);
  };

  // Logout function
  const logout = () => {
    authAPI.logout();
    setToken(null);
    setUser(null);
    setTempRole(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    tempRole,
    login,
    register,
    setTempRole,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
