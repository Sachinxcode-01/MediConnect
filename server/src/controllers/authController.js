import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, EmailOTP } from '../models/index.js';
import { sendVerificationEmail, sendLoginOTP, sendPasswordResetEmail } from '../utils/emailService.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    lastLogin: user.lastLogin
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userResponse
  });
};

// @desc    Register user (send verification email)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user (not verified yet)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient'
    });

    // Generate and send verification OTP
    const { otp } = await EmailOTP.createOTP({
      email: user.email,
      purpose: 'verification',
      userId: user._id,
      expiresInMinutes: 10
    });

    // Send verification email
    await sendVerificationEmail(user.email, otp, user.name);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Generate new OTP
    const { otp } = await EmailOTP.createOTP({
      email: user.email,
      purpose: 'verification',
      userId: user._id,
      expiresInMinutes: 10
    });

    // Send email
    await sendVerificationEmail(user.email, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Verify OTP
    const result = await EmailOTP.verifyOTP({ email, otp, purpose: 'verification' });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Update user verification status (if you add isVerified field to User model)
    const user = await User.findById(result.userId);
    if (user) {
      // You can add an isVerified field to the User model
      // user.isVerified = true;
      // await user.save();
    }

    // Generate token for auto-login after verification
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request OTP for login
// @route   POST /api/auth/login-otp
// @access  Public
export const requestLoginOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please register first.'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockExpires = new Date(user.loginAttempts.lockedUntil);
      const minutesLeft = Math.ceil((lockExpires - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Try again in ${minutesLeft} minutes`
      });
    }

    // Generate and send login OTP
    const { otp } = await EmailOTP.createOTP({
      email: user.email,
      purpose: 'login',
      userId: user._id,
      expiresInMinutes: 10
    });

    await sendLoginOTP(user.email, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'Login code sent to your email! Please check your inbox.',
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-login-otp
// @access  Public
export const verifyLoginOTP = async (req, res, next) => {
  try {
    const { email, otp, deviceFingerprint } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Verify OTP
    const result = await EmailOTP.verifyOTP({ email, otp, purpose: 'login' });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Get user
    const user = await User.findById(result.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Reset login attempts and update last login
    await user.resetLoginAttempts();
    await user.updateLastLogin();

    // Add device fingerprint if provided
    if (deviceFingerprint) {
      await user.addDeviceFingerprint(deviceFingerprint);
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (password-based)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password, deviceFingerprint } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockExpires = new Date(user.loginAttempts.lockedUntil);
      const minutesLeft = Math.ceil((lockExpires - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Try again in ${minutesLeft} minutes`
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.handleFailedLogin();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts and update last login
    await user.resetLoginAttempts();
    await user.updateLastLogin();

    // Add device fingerprint if provided
    if (deviceFingerprint) {
      await user.addDeviceFingerprint(deviceFingerprint);
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        phone: user.phone,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      address: req.body.address,
      emergencyContact: req.body.emergencyContact
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public (with valid refresh token)
export const refreshToken = async (req, res, next) => {
  res.status(200).json({
    success: false,
    message: 'Token refresh not implemented. Please login again.'
  });
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    const { otp } = await EmailOTP.createOTP({
      email: user.email,
      purpose: 'reset',
      userId: user._id,
      expiresInMinutes: 10
    });

    await sendPasswordResetEmail(user.email, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
export const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = await EmailOTP.verifyOTP({ email, otp, purpose: 'reset' });
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Usually, we just return success and wait for the reset-password endpoint to perform the actual update.
    // However, to prevent OTP invalidation before the next step (since verifyOTP usually marks it as used or deletes it in simple models), we'll recreate the OTP or we'll perform a workaround. Let's assume verifyOTP consumes it. Wait - if verifyOTP consumes it, resetPassword will fail.
    // Actually, EmailOTP.verifyOTP probably deletes it. So we shouldn't delete it here if they still need to reset in the second step.
    // Let's adjust: verifyOTP actually deletes it. Instead of consuming it, let's just generate a 'reset token' to pass to the client or assume the client will pass `resetToken`.
    // For simplicity, we can let verifyResetOTP issue a temporary reset_token, but let's just issue a standard JWT with short expiry.
    const tempToken = jwt.sign({ id: result.userId, otpVerified: true }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.status(200).json({
      success: true,
      message: 'OTP verified. Proceed to reset password.',
      tempToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, otp, tempToken } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    let userId = null;

    // Check if they passed tempToken from verify-reset-otp, or if they passed raw OTP
    if (tempToken) {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (!decoded.otpVerified) {
             return res.status(400).json({ success: false, message: 'Invalid reset flow' });
        }
        userId = decoded.id;
    } else if (otp) {
        const result = await EmailOTP.verifyOTP({ email, otp, purpose: 'reset' });
        if (!result.valid) {
            return res.status(400).json({ success: false, message: result.message });
        }
        userId = result.userId;
    } else {
        return res.status(400).json({ success: false, message: 'OTP is required to reset password.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.updatePassword(userId, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password has been successfully updated.'
    });
  } catch (error) {
    next(error);
  }
};

import axios from 'axios';

// @desc    Google standard Login
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res, next) => {
   try {
     const { credential, role } = req.body; // usually contains access token from useGoogleLogin

     if (!credential) {
        return res.status(400).json({ success: false, message: 'Google credential missing' });
     }

     // Verify access token by fetching user profile from Google
     const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credential}` }
     });
     
     const { email, name, picture, sub } = googleRes.data;
     
     if (!email) {
        return res.status(400).json({ success: false, message: 'Could not fetch Google email' });
     }

     let user = await User.findOne({ email });

     if (!user) {
        // Register the user
        user = await User.create({
            name,
            email,
            password: crypto.randomBytes(20).toString('hex'), // random unguessable password
            role: role || 'patient',
            profileImage: picture,
            googleId: sub,
        });
     }

     sendTokenResponse(user, 200, res);

   } catch (error) {
     console.error('Google Auth Error:', error.response?.data || error.message);
     res.status(401).json({ success: false, message: 'Google Authentication Failed', error: error.message });
   }
};
