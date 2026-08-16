import express from 'express';
import { getAdminStats, getAdminUsers, updateUserStatus, getAuditLogs } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/audit-logs', getAuditLogs);

export default router;
