import express from 'express';
import { 
  submitVitals, 
  getVitalsHistory, 
  getLatestVitals, 
  getDashboardVitals,
  acknowledgeAlert 
} from '../controllers/vitalsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, submitVitals);
router.get('/history', protect, getVitalsHistory);
router.get('/latest', protect, getLatestVitals);
router.get('/dashboard', protect, getDashboardVitals);
router.put('/:id/acknowledge', protect, authorize('doctor', 'admin'), acknowledgeAlert);

export default router;
