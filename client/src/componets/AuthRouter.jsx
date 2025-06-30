import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthRouter = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.app.authStatus);
  const user = useSelector((state) => state.app.user);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if user just logged in and is on the home page
    if (isAuthenticated && user?.role && location.pathname === '/') {
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
          break;
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname]);

  return children;
};

export default AuthRouter;
