import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force super_admin to use super admin dashboard only
  if (String(user?.role) === 'super_admin' && location.pathname !== '/super-admin') {
    return <Navigate to="/super-admin" replace />;
  }

  // Subscription gating: if admin and subscription inactive, redirect to /subscribe
  const isAdmin = user?.role === 'admin';
  const subStatus = user?.siteInfo?.subscription?.status;
  const isOnSubscribe = location.pathname === '/subscribe';
  if (isAdmin && subStatus && subStatus !== 'active' && !isOnSubscribe) {
    return <Navigate to="/subscribe" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
      >
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="h6" color="text.secondary">
          You don't have permission to access this page.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

