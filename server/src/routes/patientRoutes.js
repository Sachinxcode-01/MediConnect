import express from 'express';
import { getPatients, getPatientById, updatePatientProfile } from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.put('/profile', protect, updatePatientProfile);
router.get('/', protect, authorize('doctor', 'admin'), getPatients);
router.get('/:id', protect, getPatientById);

export default router;
