import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { X, Bell, Settings, Trash2, Info } from 'lucide-react';
import NotificationItem from './NotificationItem';

const NotificationCenter = ({ onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    markAllNotificationsAsRead, 
    clearAllNotifications,
    formatTimeAgo
  } = useNotification();

  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === activeTab);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/95 border border-gray-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <Bell size={20} className="mr-2 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Notification Center</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'all' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'unread' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'account' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Account
          </button>
          <button 
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'batch' 
                ? 'text-green-400 border-b-2 border-green-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Batches
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Info size={48} className="mb-2 opacity-50" />
              <p className="text-lg">No notifications in this category</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => {}}
                formatTimeAgo={formatTimeAgo}
              />
            ))
          )}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-gray-700 flex justify-between">
          <div className="flex space-x-2">
            <button
              onClick={clearAllNotifications}
              className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md text-sm flex items-center"
            >
              <Trash2 size={14} className="mr-1" /> Clear All
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md text-sm"
              >
                Mark All Read
              </button>
            )}
          </div>
          
          <button className="px-3 py-1.5 bg-gray-700/50 text-gray-300 hover:bg-gray-700 rounded-md text-sm flex items-center">
            <Settings size={14} className="mr-1" /> Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
