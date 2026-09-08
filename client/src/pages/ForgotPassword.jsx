import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Mail, Lock, ArrowRight, ArrowLeft, Shield, Eye, EyeOff, Zap, CheckCircle, XCircle, AlertCircle, Key, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

const ForgotPassword = () => {
  const [step, setStep] = useState('email'); // 'email', 'verify', 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [otpTimeLeft, setOtpTimeLeft] = useState(60);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');

  const navigate = useNavigate();

  // Derived state avoids synchronous setState within effects
  const canResendOtp = otpSent && otpTimeLeft <= 0;

  // Generate device fingerprint
  useEffect(() => {
    const generateFingerprint = async () => {
      const data = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      setDeviceFingerprint(Math.abs(hash).toString(36).toUpperCase());
    };
    generateFingerprint();
  }, []);

  // OTP countdown timer
  useEffect(() => {
    if (!otpSent || otpTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setOtpTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, otpTimeLeft]);

  // Real-time email validation
  const validateEmail = useCallback((value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    if (value.length > 254) return 'Email is too long';
    return null;
  }, []);

  // Real-time password validation
  const validatePassword = useCallback((value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (value.length > 128) return 'Password is too long';
    if (!/[A-Za-z]/.test(value)) return 'Password must contain at least one letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return null;
  }, []);

  const getPasswordStrength = () => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    const passed = Object.values(checks).filter(Boolean).length;
    return { checks, passed, percentage: (passed / 5) * 100 };
  };

  const passwordStrength = getPasswordStrength();

  const handleEmailChange = (e) => {
    const value = e.target.value.toLowerCase().trim();
    setEmail(value);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }));
    } else if (field === 'confirmPassword') {
      if (confirmPassword && password !== confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: null }));
      }
    }
  };

  // Send OTP for password reset
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await api.post('/api/auth/forgot-password', { email });
      setOtpSent(true);
      setOtpTimeLeft(60);
      setStep('verify');
      toast.success('Verification code dispatched to your email!', {
        icon: <Mail className="w-5 h-5" />,
        duration: 4000
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send code. Please verify your email address.';
      setErrors({ submit: msg });
      toast.error(msg, {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrors({ submit: 'Please enter the complete 6-digit code' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await api.post('/api/auth/verify-reset-otp', {
        email,
        otp: otpCode
      });
      toast.success('Code verified! Configure your new password.', {
        icon: <CheckCircle className="w-5 h-5" />,
        duration: 3000
      });
      setStep('reset');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed. Please try again.';
      setErrors({ submit: msg });
      toast.error(msg, {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 5000
      });
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors({});
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const digits = pastedData.split('');
    const newOtp = [...otp];
    digits.forEach((digit, i) => { if (i < 6) newOtp[i] = digit; });
    setOtp(newOtp);
    const nextIndex = Math.min(digits.length, 5);
    const nextInput = document.getElementById(`otp-${nextIndex}`);
    if (nextInput) nextInput.focus();
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      toast.success('Code resent! Please check your email.', {
        icon: <Mail className="w-5 h-5" />,
        duration: 4000
      });
      setOtpTimeLeft(60);
      setOtp(['', '', '', '', '', '']);
    } catch (_err) {
      toast.error('Failed to resend code.', {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrors({ submit: 'Please verify your email first' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await api.post('/api/auth/reset-password', {
        email,
        otp: otpCode,
        newPassword: password,
        deviceFingerprint
      });
      toast.success('Password reset successful! Redirecting to login...', {
        icon: '🎉',
        duration: 4000
      });
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Password reset failed. Please try again.';
      setErrors({ submit: msg });
      toast.error(msg, {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-geist overflow-hidden relative selection:bg-emerald-500/30">
      {/* Glow Backdrops */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-teal-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto flex z-10 min-h-screen">
        {/* Left Side: Info (Desktop) */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex w-1/2 flex-col justify-center p-12 xl:p-20"
        >
          <Link to="/" className="flex items-center gap-3 mb-16 group w-fit">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="text-slate-950 w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">MediConnect</span>
          </Link>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
              <Shield size={13} /> Account Security Recovery
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight">
              Reset Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 italic">
                Clinical Access
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-md leading-relaxed">
              Verify your registered identity via single-use encrypted OTP to securely restore your patient or doctor portal access.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-6 max-w-md">
              <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80">
                <RefreshCw className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-xl font-black text-white">60s</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OTP Expiry</p>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80">
                <Zap className="w-5 h-5 text-teal-400 mb-2" />
                <p className="text-xl font-black text-white">&lt; 15s</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery Time</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Step Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="text-slate-950 w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white">MediConnect</span>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-6 sm:p-10 rounded-3xl shadow-2xl relative"
          >
            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {step === 'email' && 'Forgot Password'}
                {step === 'verify' && 'Verify Identity'}
                {step === 'reset' && 'New Password'}
              </h2>
              <p className="text-xs text-slate-400 uppercase tracking-wider mt-1.5">
                {step === 'email' && 'Enter your registered email'}
                {step === 'verify' && 'Check your inbox for 6-digit code'}
                {step === 'reset' && 'Establish strong credentials'}
              </p>
            </div>

            {/* Step Progress Indicators */}
            <div className="flex justify-center items-center gap-2 mb-6">
              {[
                { s: 'email', icon: Mail },
                { s: 'verify', icon: Key },
                { s: 'reset', icon: Lock }
              ].map((item, idx) => (
                <React.Fragment key={item.s}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    step === item.s || (step === 'verify' && item.s === 'email') || (step === 'reset')
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    <item.icon size={16} />
                  </div>
                  {idx < 2 && (
                    <div className={`w-8 h-0.5 transition-all ${
                      (step === 'verify' && idx === 0) || step === 'reset'
                        ? 'bg-emerald-500'
                        : 'bg-slate-800'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {errors.submit && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                <AlertCircle size={15} />
                {errors.submit}
              </div>
            )}

            {/* Step 1: Email Form */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={() => handleBlur('email')}
                      className={`w-full bg-slate-950/60 border rounded-xl pl-11 pr-11 py-3.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                        errors.email ? 'border-red-500/50' : touched.email && !errors.email ? 'border-emerald-500/50' : 'border-slate-800'
                      }`}
                      placeholder="physician@hospital.org"
                      autoComplete="email"
                    />
                    {touched.email && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {!errors.email ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400 font-bold ml-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.email}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Send Verification Code
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center">
                  <p className="text-xs text-slate-400">
                    6-digit code delivered to <span className="font-bold text-emerald-400">{email}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center block">
                    Security Passcode
                  </label>
                  <div className="flex gap-2 sm:gap-3 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-mono font-black rounded-xl bg-slate-950/70 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-slate-400">Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResendOtp || isSubmitting}
                    className={`font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      canResendOtp && !isSubmitting
                        ? 'text-emerald-400 hover:text-emerald-300 cursor-pointer'
                        : 'text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <RefreshCw size={12} className={isSubmitting ? 'animate-spin' : ''} />
                    {canResendOtp ? 'Resend' : formatTime(otpTimeLeft)}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !otp.every(d => d !== '')}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Key size={16} />
                      Verify Code
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 3: Reset Password Form */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleBlur('password')}
                      className={`w-full bg-slate-950/60 border rounded-xl pl-11 pr-11 py-3.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                        errors.password ? 'border-red-500/50' : touched.password && !errors.password ? 'border-emerald-500/50' : 'border-slate-800'
                      }`}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400 font-bold ml-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.password}
                    </p>
                  )}

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              i < passwordStrength.passed
                                ? passwordStrength.percentage < 40
                                  ? 'bg-red-500'
                                  : passwordStrength.percentage < 80
                                  ? 'bg-yellow-500'
                                  : 'bg-emerald-500'
                                : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (touched.confirmPassword && e.target.value !== password) {
                          setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                        } else if (touched.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: null }));
                        }
                      }}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={`w-full bg-slate-950/60 border rounded-xl pl-11 pr-11 py-3.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                        errors.confirmPassword ? 'border-red-500/50' : touched.confirmPassword && !errors.confirmPassword ? 'border-emerald-500/50' : 'border-slate-800'
                      }`}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-400 font-bold ml-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !password || !confirmPassword || password !== confirmPassword}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Reset Password
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Back to Login Link */}
            <div className="mt-6 text-center pt-4 border-t border-slate-800/80">
              <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Back to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
