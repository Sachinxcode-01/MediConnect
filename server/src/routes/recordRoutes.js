import express from 'express';
import { 
  createRecord, 
  getPatientRecords, 
  getMyRecords, 
  getRecord, 
  updateRecord, 
  deleteRecord,
  getDoctorRecords,
  saveScribeBrief,
  summarizeRecord,
  upload
} from '../controllers/recordController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Base GET route for medical records
router.get('/', protect, (req, res, next) => {
  if (req.user?.role === 'doctor') {
    return getDoctorRecords(req, res, next);
  }
  return getMyRecords(req, res, next);
});

router.post('/', protect, upload.single('file'), createRecord);
router.post('/scribe', protect, authorize('doctor'), saveScribeBrief);
router.post('/:id/summarize', protect, summarizeRecord);
router.get('/my', protect, getMyRecords);

router.get('/patient/:patientId', protect, getPatientRecords);
router.get('/doctor/my', protect, authorize('doctor', 'admin'), getDoctorRecords);
router.get('/:id', protect, getRecord);
router.put('/:id', protect, authorize('doctor', 'admin'), updateRecord);
router.delete('/:id', protect, authorize('doctor', 'admin'), deleteRecord);

export default router;
