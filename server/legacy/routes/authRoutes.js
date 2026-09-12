const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, refresh, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased for dev testing
  message: 'Too many login attempts, please try again in 15 minutes'
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect(), getMe);

module.exports = router;
