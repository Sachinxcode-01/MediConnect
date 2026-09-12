import express from 'express';
import { getChatResponse } from '../controllers/chatController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalAuth, getChatResponse);

export default router;
