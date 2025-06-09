import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const RedirectIfAuthenticated: React.FC<RedirectIfAuthenticatedProps> = ({ 
  children, 
  redirectTo = '/' 
}) => {
  const { isAuthenticated, loading } = useAuth();

  // If authentication is still loading, show nothing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If authenticated, redirect to the specified route
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If not authenticated, render the children
  return <>{children}</>;
};

export default RedirectIfAuthenticated;