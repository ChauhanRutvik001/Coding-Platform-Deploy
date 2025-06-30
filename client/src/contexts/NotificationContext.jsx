import React, { createContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const user = useSelector((state) => state.app.user);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user && user._id && !socketRef.current) {
      // console.log('Initializing socket connection for user:', user._id);
      
      // Instead of trying to access HttpOnly cookies directly,
      // we'll request a socket token from the server
      const connectWithSocketToken = async () => {
        try {
          // Request socket token from server
          const response = await axiosInstance.get('/auth/socket-token');
          
          if (!response.data.success || !response.data.socketToken) {
            console.warn('Failed to get socket authentication token');
            return;
          }
          
          const socketToken = response.data.socketToken;
          
          // Now connect with the provided token
          const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3100', {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            forceNew: true,
            auth: { token: socketToken }
          });

          socketRef.current = newSocket;
          setSocket(newSocket);

          // Connection handlers
          newSocket.on('connect', () => {
            // console.log('Connected to notification server');
            setConnected(true);
            
            // Authenticate user with socket server
            newSocket.emit('authenticate', {
              userId: user._id,
              role: user.role
            });
          });

          newSocket.on('disconnect', () => {
            // console.log('Disconnected from notification server');
            setConnected(false);
          });

          // Handle real-time notifications
          newSocket.on('newNotification', (notification) => {
            // console.log('New notification received:', notification);
            
            // Add notification to state
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast notification
            showToastNotification(notification);
          });

          // Handle connection errors
          newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setConnected(false);
            // Don't attempt to reconnect immediately to avoid rapid reconnection attempts
            setTimeout(() => {
              console.log('Attempting to reconnect to notification server...');
            }, 5000);
          });

          newSocket.on('error', (error) => {
            console.error('Socket error:', error);
          });

          newSocket.on('auth_error', (error) => {
            console.error('Socket authentication error:', error);
          });
          
        } catch (error) {
          console.error('Error fetching socket token:', error);
        }
      };
      
      connectWithSocketToken();
      
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [user]);

  // Load initial notifications (you can implement this as an API call)
  useEffect(() => {
    if (user) {
      loadInitialNotifications();
    }
  }, [user]);

  const loadInitialNotifications = async () => {
    try {
      const response = await axiosInstance.get('/notifications');
      if (response.data && response.data.success) {
        const { notifications, unreadCount } = response.data.data;
        
        // Transform notifications to match expected format
        const formattedNotifications = notifications.map(notification => ({
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read,
          timestamp: new Date(notification.createdAt),
          data: notification.data || {}
        }));

        setNotifications(formattedNotifications);
        setUnreadCount(unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      
      // Fallback to empty notifications if API fails
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const showToastNotification = (notification) => {
    // Customize toast based on notification type
    const toastOptions = {
      duration: 5000,
      position: 'top-right',
    };

    switch (notification.type) {
      case 'account':
        toast.success(`🎉 ${notification.title}`, toastOptions);
        break;
      case 'batch':
        toast.info(`📚 ${notification.title}`, toastOptions);
        break;
      case 'grade':
        toast.success(`📊 ${notification.title}`, toastOptions);
        break;
      case 'contest':
        toast(`🏆 ${notification.title}`, {
          ...toastOptions,
          icon: '🏆',
        });
        break;
      case 'assignment':
      case 'problem':
        toast(`📝 ${notification.title}`, {
          ...toastOptions,
          icon: '📝',
        });
        break;
      case 'student':
        toast.info(`👨‍🎓 ${notification.title}`, toastOptions);
        break;
      default:
        toast(notification.title, toastOptions);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    // Optimistically update UI
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      // Call API to persist the change
      await axiosInstance.patch(`/notifications/${notificationId}/read`);
      
      // Emit to socket for real-time updates
      if (socket) {
        socket.emit('markNotificationRead', notificationId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: false }
            : notification
        )
      );
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAllNotificationsAsRead = async () => {
    // Store previous state for potential rollback
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    // Optimistically update UI
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);

    try {
      // Call API to persist the change
      await axiosInstance.patch('/notifications/mark-all-read');
      
      // Emit to socket for real-time updates
      if (socket) {
        socket.emit('markAllNotificationsRead', user._id);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Revert optimistic update on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  const clearNotification = async (notificationId) => {
    // Store notification for potential rollback
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    
    // Optimistically update UI
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.read ? Math.max(0, prev - 1) : prev;
    });

    try {
      // Call API to delete notification
      await axiosInstance.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      // Revert optimistic update on error
      if (notificationToDelete) {
        setNotifications(prev => [notificationToDelete, ...prev]);
        if (!notificationToDelete.read) {
          setUnreadCount(prev => prev + 1);
        }
      }
    }
  };

  const clearAllNotifications = async () => {
    // Store previous state for potential rollback
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    // Optimistically update UI
    setNotifications([]);
    setUnreadCount(0);

    try {
      // Call API to clear all notifications
      await axiosInstance.delete('/notifications');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      
      // Revert optimistic update on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - new Date(timestamp)) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const value = {
    notifications,
    unreadCount,
    connected,
    socket,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    clearAllNotifications,
    formatTimeAgo,
    loadInitialNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
