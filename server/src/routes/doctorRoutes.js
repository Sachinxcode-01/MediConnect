import express from 'express';
import { getDoctors, getDoctorById, verifyDoctor } from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.put('/:id/verify', protect, authorize('admin'), verifyDoctor);

export default router;
