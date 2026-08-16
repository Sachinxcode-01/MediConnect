import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, createNotification } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
