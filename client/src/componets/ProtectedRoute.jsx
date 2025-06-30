import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import Login from './Login';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = useSelector((state) => state.app.authStatus);
  const user = useSelector((state) => state.app.user);

  // If not authenticated, show login
  if (!isAuthenticated) {
    return <Login />;
  }

  // If authenticated but no role restrictions, allow access
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user's role is in allowed roles
  const userRole = user?.role?.toLowerCase();
  const hasPermission = allowedRoles.some(role => role.toLowerCase() === userRole);

  if (!hasPermission) {
    // Redirect to appropriate page based on user role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/pending-requests" replace />;
      case 'faculty':
        return <Navigate to="/profile" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
