import express from 'express';
import { getChatResponse } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, getChatResponse);

export default router;
