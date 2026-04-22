import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Store active users
const activeUsers = new Map();

// Socket event handlers
export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle user authentication on socket connection
    socket.on('authenticate', async (data) => {
      try {
        const { token } = data;

        if (!token) {
          socket.emit('auth_error', { message: 'No token provided' });
          return;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
          socket.emit('auth_error', { message: 'User not found' });
          return;
        }

        // Store user in active users
        activeUsers.set(socket.id, {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        });

        // Join user to their personal room
        socket.join(`user:${user._id}`);

        // Join role-based room
        socket.join(`role:${user.role}`);

        socket.emit('authenticated', {
          userId: user._id,
          role: user.role
        });

        console.log(`User ${user.email} authenticated on socket ${socket.id}`);
      } catch (error) {
        console.error('Socket authentication error:', error.message);
        socket.emit('auth_error', { message: 'Authentication failed' });
      }
    });

    // Handle appointment notifications
    socket.on('join_appointment_room', (appointmentId) => {
      socket.join(`appointment:${appointmentId}`);
      console.log(`Socket ${socket.id} joined appointment room: ${appointmentId}`);
    });

    // Handle telemedicine room
    socket.on('join_consultation', (consultationId) => {
      socket.join(`consultation:${consultationId}`);
      console.log(`Socket ${socket.id} joined consultation: ${consultationId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        console.log(`User ${user.email} disconnected`);
        activeUsers.delete(socket.id);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Helper function to send notification to user
  io.sendToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  // Helper function to send notification to role group
  io.sendToRole = (role, event, data) => {
    io.to(`role:${role}`).emit(event, data);
  };

  console.log('Socket.io initialized successfully');
};

export { activeUsers };
