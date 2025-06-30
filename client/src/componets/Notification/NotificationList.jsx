import React from 'react';
import NotificationItem from './NotificationItem';
import { useNotification } from '../../contexts/NotificationContext';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const NotificationList = ({ onClose, onViewAll, isCompact = false }) => {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    formatTimeAgo,
    clearAllNotifications
  } = useNotification();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl overflow-hidden ${
        isCompact ? 'w-full' : 'w-80 sm:w-96'
      }`}
    >
      <div className="px-3 sm:px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
        {notifications.length === 0 ? (
        <div className="px-4 py-6 text-center text-gray-400 text-sm">
          <p>No notifications yet</p>
          <p className="mt-1 text-xs">You're all caught up!</p>
        </div>
      ) : (
        <>
          <div className={`overflow-y-auto ${isCompact ? 'max-h-48' : 'max-h-[70vh]'}`}>
            {notifications.slice(0, 5).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={markNotificationAsRead}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </div>
          
          {notifications.length > 5 && (
            <div className="p-2 border-t border-gray-700 text-center">
              <button 
                onClick={onViewAll}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center w-full py-1.5 hover:bg-blue-500/10 rounded-md transition-colors"
              >
                View All ({notifications.length}) <ExternalLink size={14} className="ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default NotificationList;
