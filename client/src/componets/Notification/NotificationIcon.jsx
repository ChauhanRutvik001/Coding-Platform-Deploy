import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationIcon = ({ unreadCount, onClick, className = '' }) => {
  const [pulse, setPulse] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadCount);

  // Trigger animation when unread count increases
  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(timer);
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

  return (
    <button
      onClick={onClick}
      className={`relative p-1.5 rounded-md transition-colors ${className}`}
      title={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
    >
      <AnimatePresence>
        {pulse && (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.3 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-blue-400 rounded-full"
          />
        )}
      </AnimatePresence>
      <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
      
      {unreadCount > 0 && (
        <motion.span 
          key="badge"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold text-[9px] sm:text-[10px]"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      )}
    </button>
  );
};

export default NotificationIcon;
