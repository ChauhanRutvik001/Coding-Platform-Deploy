import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

let io;
const connectedUsers = new Map();

export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      
      // Make sure this is a socket token (if using dedicated socket tokens)
      if (decoded.purpose === 'socket') {
        // Check if user exists and session is valid
        const user = await User.findById(decoded.id);
        
        if (!user || user.sessionId !== decoded.sessionId) {
          return next(new Error('Authentication error: Invalid session'));
        }
        
        // Attach user data to socket
        socket.user = {
          id: user._id.toString(),
          role: user.role
        };
      } else {
        // If using regular auth token
        const user = await User.findById(decoded.id);
        
        if (!user || user.sessionId !== decoded.sessionId) {
          return next(new Error('Authentication error: Invalid session'));
        }
        
        // Attach user data to socket
        socket.user = {
          id: user._id.toString(),
          role: user.role
        };
      }
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: ' + (error.message || 'Invalid token')));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user?.id}`);
    
    // Store connected user
    if (socket.user?.id) {
      connectedUsers.set(socket.user.id, socket.id);
      socket.join(socket.user.id); // Join user's personal room
      console.log(`User ${socket.user.id} joined their private room`);
      console.log(`Current connected users: ${connectedUsers.size}`);
    }
    
    // Handle authentication
    socket.on('authenticate', (userData) => {
      console.log('User authenticated:', userData);
    });
    
    // Handle marking notifications as read
    socket.on('markNotificationRead', (notificationId) => {
      console.log(`Notification ${notificationId} marked as read by ${socket.user?.id}`);
    });
    
    // Handle marking all notifications as read
    socket.on('markAllNotificationsRead', (userId) => {
      console.log(`All notifications marked as read by ${userId}`);
    });
    
    socket.on('disconnect', () => {
      if (socket.user?.id) {
        connectedUsers.delete(socket.user.id);
        console.log(`User disconnected: ${socket.user.id}`);
        console.log(`Remaining connected users: ${connectedUsers.size}`);
      }
    });
  });

  return { io, connectedUsers };
};

// Create a notification service class
class NotificationService {
  constructor(io, connectedUsers) {
    this.io = io;
    this.connectedUsers = connectedUsers;
  }

  async createNotification(userId, title, message, type = 'info', data = {}) {
    try {
      if (!userId || !title || !message) {
        console.error('Missing required notification parameters');
        return false;
      }

      if (!this.io) {
        console.error('Socket.io instance not initialized');
        return false;
      }

      // Create notification object
      const notification = {
        id: Date.now().toString(), // Temporary ID
        userId,
        title,
        message,
        type,
        data,
        read: false,
        timestamp: new Date()
      };

      // Check if user is connected
      if (this.connectedUsers && this.connectedUsers.has(userId)) {
        console.log(`User ${userId} is connected, sending real-time notification`);
        // Emit to specific user via their room
        this.io.to(userId).emit('newNotification', notification);
      } else {
        console.log(`User ${userId} is not connected, notification will be stored only`);
        // Here you would typically save to database for offline users
        // This is handled by the notification controller
      }
      
      console.log(`Notification created for user ${userId}: ${title}`);
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }
}

export const initNotificationService = (io, connectedUsers) => {
  if (!io) {
    console.error('Cannot initialize notification service: Socket.io instance is undefined');
    return {
      createNotification: () => {
        console.error('Notification service not properly initialized');
        return false;
      }
    };
  }
  return new NotificationService(io, connectedUsers);
};

export { connectedUsers };
