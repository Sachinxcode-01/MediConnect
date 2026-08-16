import express from 'express';
import { getPatients, getPatientById } from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('doctor', 'admin'), getPatients);
router.get('/:id', protect, getPatientById);

export default router;
