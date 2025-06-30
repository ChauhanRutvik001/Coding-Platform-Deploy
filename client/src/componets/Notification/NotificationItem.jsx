import React from 'react';
import { 
  Bell, 
  BookOpen, 
  Award, 
  Users, 
  FileText, 
  User, 
  GraduationCap,
  AlertCircle
} from 'lucide-react';

const NotificationItem = ({ 
  notification, 
  onClick, 
  formatTimeAgo
}) => {
  // Get the appropriate icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'account':
        return <User className="text-blue-400" size={16} />;
      case 'batch':
        return <Users className="text-emerald-400" size={16} />;
      case 'grade':
        return <GraduationCap className="text-yellow-400" size={16} />;
      case 'contest':
        return <Award className="text-purple-400" size={16} />;
      case 'problem':
        return <FileText className="text-indigo-400" size={16} />;
      case 'assignment':
        return <BookOpen className="text-cyan-400" size={16} />;
      case 'student':
        return <User className="text-orange-400" size={16} />;
      default:
        return <Bell className="text-gray-400" size={16} />;
    }
  };

  // Get background color based on notification type
  const getTypeColor = () => {
    switch (notification.type) {
      case 'account':
        return 'bg-blue-500/10';
      case 'batch':
        return 'bg-emerald-500/10';
      case 'grade':
        return 'bg-yellow-500/10';
      case 'contest':
        return 'bg-purple-500/10';
      case 'problem':
      case 'assignment':
        return 'bg-indigo-500/10';
      case 'student':
        return 'bg-orange-500/10';
      default:
        return 'bg-gray-500/10';
    }
  };

  return (
    <div
      onClick={() => !notification.read && onClick(notification.id)}
      className={`px-3 py-3 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer ${
        !notification.read ? getTypeColor() : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="mt-1 flex-shrink-0">
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-blue-500 mb-1.5"></div>
          )}
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${
            !notification.read ? 'text-white' : 'text-gray-300'
          }`}>
            {notification.title}
          </p>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <span className="inline-block mr-1">
              <AlertCircle size={10} />
            </span>
            {formatTimeAgo(notification.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
