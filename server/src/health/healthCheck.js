import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

/**
 * @route GET /health
 * @desc Basic alive check
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /health/live
 * @desc Liveness probe
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    uptime: process.uptime()
  });
});

/**
 * @route GET /health/ready
 * @desc Readiness probe verifying dependency health (Database/Supabase)
 */
router.get('/ready', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') {
      return res.status(503).json({
        success: false,
        status: 'unready',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'unready',
      error: err.message
    });
  }
});

export default router;
