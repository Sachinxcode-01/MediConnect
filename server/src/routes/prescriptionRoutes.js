import express from 'express';
import { createPrescription, getPrescriptions, getMyPrescriptions } from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('doctor'), createPrescription);
router.get('/', protect, authorize('doctor', 'admin'), getPrescriptions);
router.get('/my', protect, authorize('patient'), getMyPrescriptions);

export default router;
