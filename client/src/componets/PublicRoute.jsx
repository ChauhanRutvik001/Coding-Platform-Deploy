import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.app.authStatus);
  const user = useSelector((state) => state.app.user);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, redirect them based on their role
    if (isAuthenticated && user?.role) {
      const userRole = user.role.toLowerCase();
      
      switch (userRole) {
        case 'admin':
          navigate('/pending-requests', { replace: true });
          break;
        case 'faculty':
          navigate('/profile', { replace: true });
          break;
        case 'student':
          navigate('/student', { replace: true });
          break;
        default:
          navigate('/browse', { replace: true });
          break;
      }
    }
  }, [isAuthenticated, user, navigate]);

  // If user is authenticated, don't render the children (login component)
  // Instead, return null as they will be redirected
  if (isAuthenticated) {
    return null;
  }

  return children;
};

export default PublicRoute;
