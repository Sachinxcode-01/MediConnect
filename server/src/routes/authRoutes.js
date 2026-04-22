import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  updateDetails,
  updatePassword,
  verifyEmail,
  resendVerification,
  requestLoginOTP,
  verifyLoginOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  googleLogin
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Registration and verification
router.post('/register', authLimiter, register);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);

// OTP-based login
router.post('/login-otp', authLimiter, requestLoginOTP);
router.post('/verify-login-otp', authLimiter, verifyLoginOTP);

// Password-based login
router.post('/login', authLimiter, login);

// Forgot Password
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-reset-otp', authLimiter, verifyResetOTP);
router.post('/reset-password', authLimiter, resetPassword);

// Google Sign-In
router.post('/google', authLimiter, googleLogin);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

export default router;
