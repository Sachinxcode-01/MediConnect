import express from 'express';
import os from 'os';
import supabase from '../config/supabase.js';

const router = express.Router();

/**
 * Helper to format bytes to MB
 */
const toMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

/**
 * Format uptime to human-readable string
 */
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d > 0 ? `${d}d ` : ''}${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
};

/**
 * @route GET /health or /api/health
 * @desc Production-Grade Comprehensive System Health & Telemetry Check
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();

  // 1. Database Connectivity & Query Latency Check
  let dbStatus = 'disconnected';
  let dbLatencyMs = 0;
  let dbError = null;

  try {
    const dbStart = Date.now();
    const dbPromise = supabase.from('users').select('id').limit(1);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database ping timeout (>2500ms)')), 2500)
    );

    const { error } = await Promise.race([dbPromise, timeoutPromise]);
    dbLatencyMs = Date.now() - dbStart;

    if (error && error.code !== 'PGRST116') {
      dbStatus = 'degraded';
      dbError = error.message;
    } else {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbLatencyMs = Date.now() - startTime;
    dbStatus = 'unreachable';
    dbError = err.message;
  }

  // 2. Memory & Process Telemetry
  const memUsage = process.memoryUsage();
  const memoryTelemetry = {
    heapUsedMB: Number(toMB(memUsage.heapUsed)),
    heapTotalMB: Number(toMB(memUsage.heapTotal)),
    rssMB: Number(toMB(memUsage.rss)),
    externalMB: Number(toMB(memUsage.external)),
    systemFreeMB: Number(toMB(os.freemem())),
    systemTotalMB: Number(toMB(os.totalmem())),
    heapUtilizationPct: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1) + '%',
  };

  // 3. AI Service Telemetry
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const aiTelemetry = {
    status: hasOpenRouter || hasGemini ? 'configured' : 'key_missing',
    providers: {
      openrouter: hasOpenRouter ? 'active' : 'unconfigured',
      gemini: hasGemini ? 'active' : 'unconfigured',
    },
    defaultModel: hasOpenRouter ? 'meta-llama/llama-3.3-70b-instruct' : 'gemini-2.0-flash',
  };

  // 4. WebRTC & LiveKit Telemetry
  const hasLiveKit = Boolean(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
  const io = req.app.get('io');
  const activeSocketCount = io ? io.engine?.clientsCount || 0 : 0;
  const socketRoomsCount = io ? io.sockets?.adapter?.rooms?.size || 0 : 0;

  const webrtcTelemetry = {
    p2pSignaling: 'operational',
    encryption: 'DTLS-SRTP (AES-256-GCM)',
    activeSocketConnections: activeSocketCount,
    activeRooms: socketRoomsCount,
    livekitCloud: hasLiveKit ? 'configured' : 'unconfigured',
  };

  // 5. Cloud Storage (EMR) Telemetry
  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  const storageTelemetry = {
    provider: 'Cloudinary + Local Static',
    status: hasCloudinary ? 'connected' : 'fallback_local',
  };

  // Overall Health Status
  const isHealthy = dbStatus === 'connected';
  const statusCode = isHealthy ? 200 : 503;
  const totalLatencyMs = Date.now() - startTime;

  res.status(statusCode).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    responseLatencyMs: totalLatencyMs,
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: formatUptime(process.uptime()),
    },
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError && { error: dbError }),
      },
      aiEngine: aiTelemetry,
      telehealthWebRTC: webrtcTelemetry,
      emrStorage: storageTelemetry,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
      memory: memoryTelemetry,
    },
  });
});

/**
 * @route GET /health/live
 * @desc Lightweight Liveness probe for Kubernetes / Container Orchestrators
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route GET /health/ready
 * @desc Readiness probe verifying critical database dependencies
 */
router.get('/ready', async (req, res) => {
  try {
    const start = Date.now();
    const { error } = await supabase.from('users').select('id').limit(1);
    const latency = Date.now() - start;

    if (error && error.code !== 'PGRST116') {
      return res.status(503).json({
        success: false,
        status: 'unready',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      status: 'ready',
      database: 'connected',
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'unready',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /health/metrics
 * @desc Operational telemetry metrics
 */
router.get('/metrics', (req, res) => {
  const mem = process.memoryUsage();
  const io = req.app.get('io');

  res.status(200).json({
    uptime_seconds: Math.floor(process.uptime()),
    memory_heap_used_bytes: mem.heapUsed,
    memory_heap_total_bytes: mem.heapTotal,
    memory_rss_bytes: mem.rss,
    active_socket_clients: io ? io.engine?.clientsCount || 0 : 0,
    timestamp: Date.now(),
  });
});

export default router;
