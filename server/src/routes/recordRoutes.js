import express from 'express';
import { 
  createRecord, 
  getPatientRecords, 
  getMyRecords, 
  getRecord, 
  updateRecord, 
  deleteRecord,
  getDoctorRecords,
  saveScribeBrief
} from '../controllers/recordController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('doctor', 'admin'), createRecord);
router.post('/scribe', protect, authorize('doctor'), saveScribeBrief);
router.get('/my', protect, getMyRecords);

router.get('/patient/:patientId', protect, getPatientRecords);
router.get('/doctor/my', protect, authorize('doctor', 'admin'), getDoctorRecords);
router.get('/:id', protect, getRecord);
router.put('/:id', protect, authorize('doctor', 'admin'), updateRecord);
router.delete('/:id', protect, authorize('doctor', 'admin'), deleteRecord);

export default router;
