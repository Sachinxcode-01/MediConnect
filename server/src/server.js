import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './config/supabase.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initializeSocket } from './socket/socketHandler.js';
import {
  authRoutes,
  triageRoutes,
  recordRoutes,
  appointmentRoutes,
  vitalsRoutes,
  pharmacyRoutes,
  chatRoutes,
  videoRoutes,
  livekitRoutes,
  patientRoutes,
  doctorRoutes,
  prescriptionRoutes,
  adminRoutes,
  notificationRoutes
} from './routes/index.js';

// Load env vars
dotenv.config();

// ES6 __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test Supabase connection
(async () => {
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
  } else {
    console.log('✅ Supabase connected successfully');
  }
})();

// Initialize express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3002', 'http://localhost:3001', 'http://localhost:3000'] : ['http://localhost:5173', 'http://localhost:3002', 'http://localhost:3001', 'http://localhost:3000'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize socket handlers
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS middleware
app.use(cors({
  origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3002', 'http://localhost:3001', 'http://localhost:3000'] : ['http://localhost:5173', 'http://localhost:3002', 'http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Compression
app.use(compression());

// Rate limiting
app.use('/api', apiLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

import healthCheckRoutes from './health/healthCheck.js';

// Health Check Probes (/health, /health/live, /health/ready)
app.use('/health', healthCheckRoutes);

// API Routes (v1 & legacy aliases)
const apiRoutesMap = [
  ['/api/auth', authRoutes],
  ['/api/v1/auth', authRoutes],
  ['/api/triage', triageRoutes],
  ['/api/v1/triage', triageRoutes],
  ['/api/records', recordRoutes],
  ['/api/v1/records', recordRoutes],
  ['/api/appointments', appointmentRoutes],
  ['/api/v1/appointments', appointmentRoutes],
  ['/api/vitals', vitalsRoutes],
  ['/api/v1/vitals', vitalsRoutes],
  ['/api/wearables', vitalsRoutes],
  ['/api/pharmacy', pharmacyRoutes],
  ['/api/v1/pharmacy', pharmacyRoutes],
  ['/api/video', videoRoutes],
  ['/api/v1/telehealth', videoRoutes],
  ['/api/chat', chatRoutes],
  ['/api/livekit', livekitRoutes],
  ['/api/patients', patientRoutes],
  ['/api/v1/patients', patientRoutes],
  ['/api/doctors', doctorRoutes],
  ['/api/v1/doctors', doctorRoutes],
  ['/api/prescriptions', prescriptionRoutes],
  ['/api/v1/prescriptions', prescriptionRoutes],
  ['/api/notifications', notificationRoutes],
  ['/api/v1/notifications', notificationRoutes],
  ['/api/admin', adminRoutes],
  ['/api/v1/admin', adminRoutes],
];

apiRoutesMap.forEach(([path, route]) => app.use(path, route));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: `Route '${req.originalUrl}' not found`
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   MediConnect Server Running                              ║
║                                                           ║
║   API:    http://localhost:${PORT}                         ║
║   Socket: ws://localhost:${PORT}                           ║
║   Mode:   ${process.env.NODE_ENV || 'development'}                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  httpServer.close(() => process.exit(1));
});

export { io };

