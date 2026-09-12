import express from 'express';
import { 
  submitTriage, 
  getTriageHistory, 
  getTriageEntry, 
  getAllTriageEntries, 
  assignDoctor, 
  addNote, 
  updateStatus,
  analyzeChatHistory,
  evaluateSymptoms
} from '../controllers/triageController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/evaluate', optionalAuth, evaluateSymptoms);
router.post('/', protect, authorize('patient', 'doctor'), submitTriage);
router.post('/analyze', protect, authorize('doctor'), analyzeChatHistory);
router.get('/', protect, getTriageHistory);

router.get('/all', protect, authorize('doctor', 'admin'), getAllTriageEntries);
router.get('/queue', protect, authorize('doctor', 'admin'), getAllTriageEntries);
router.get('/:id', protect, getTriageEntry);
router.put('/:id/assign', protect, authorize('doctor', 'admin'), assignDoctor);
router.post('/:id/notes', protect, authorize('doctor', 'admin'), addNote);
router.put('/:id/status', protect, authorize('doctor', 'admin'), updateStatus);

export default router;
