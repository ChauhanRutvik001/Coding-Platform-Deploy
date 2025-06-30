import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import Browse from './Browse';

const RoleBasedHome = () => {
  const isAuthenticated = useSelector((state) => state.app.authStatus);
  const user = useSelector((state) => state.app.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role && location.pathname === '/' && !hasRedirected) {
      const userRole = user.role.toLowerCase();
      
      setHasRedirected(true);
      
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
          // Stay on current page for unknown roles
          break;
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname, hasRedirected]);

  // Reset redirect flag when authentication status changes
  useEffect(() => {
    if (!isAuthenticated) {
      setHasRedirected(false);
    }
  }, [isAuthenticated]);

  // If not authenticated or no redirect needed, show Browse page
  return <Browse isAuthenticated={isAuthenticated} />;
};

export default RoleBasedHome;
