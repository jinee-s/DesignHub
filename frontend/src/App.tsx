import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './api/types';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UploadPage } from './pages/UploadPage';
import { DesignDetailPage } from './pages/DesignDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { LandingPage } from './pages/LandingPage';
import { DesignerDashboard } from './pages/DesignerDashboard';
import { ClientDashboard } from './pages/ClientDashboard';

// Layout
import { MainLayout } from './components/layout/MainLayout';

// UI
import { Loading } from './components/ui';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <Loading variant="fullscreen" />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function RoleProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode, 
  requiredRole: UserRole 
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <Loading variant="fullscreen" />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <Loading variant="fullscreen" />;
  }
  
  return (
    <Routes>
      {/* Landing page for unauthenticated users */}
      {!isAuthenticated && <Route path="/landing" element={<LandingPage />} />}
      
      <Route element={<MainLayout />}>
        <Route path="/" element={isAuthenticated ? <HomePage /> : <LandingPage />} />
        <Route path="/design/:id" element={<DesignDetailPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
      </Route>
      
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Role-based dashboards */}
      <Route element={<MainLayout />}>
        <Route 
          path="/designer/dashboard" 
          element={
            <RoleProtectedRoute requiredRole="designer">
              <DesignerDashboard />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/client/dashboard" 
          element={
            <RoleProtectedRoute requiredRole="client">
              <ClientDashboard />
            </RoleProtectedRoute>
          } 
        />
      </Route>
      
      <Route element={<MainLayout />}>
        <Route 
          path="/create" 
          element={
            <RoleProtectedRoute requiredRole="designer">
              <UploadPage />
            </RoleProtectedRoute>
          } 
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
