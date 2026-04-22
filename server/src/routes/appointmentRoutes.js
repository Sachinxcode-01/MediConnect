import express from 'express';
import { 
  createAppointment, 
  getPatientAppointments, 
  getDoctorAppointments, 
  getUpcomingAppointments,
  getAppointment, 
  updateStatus, 
  cancelAppointment,
  joinRoom
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createAppointment);
router.get('/patient', protect, getPatientAppointments);
router.get('/doctor', protect, getDoctorAppointments);
router.get('/upcoming', protect, getUpcomingAppointments);
router.get('/:id', protect, getAppointment);
router.get('/:id/join', protect, joinRoom);
router.put('/:id/status', protect, updateStatus);
router.put('/:id/cancel', protect, cancelAppointment);

export default router;
