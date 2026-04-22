import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Mail, Lock, ArrowRight, Shield, Eye, EyeOff, Zap, CheckCircle, XCircle, AlertCircle, Key, RefreshCw, Smartphone } from 'lucide-react';
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
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');

  const navigate = useNavigate();

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
    if (otpSent && otpTimeLeft > 0) {
      const timer = setTimeout(() => setOtpTimeLeft(otpTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (otpSent && otpTimeLeft === 0) {
      setCanResendOtp(true);
    }
  }, [otpSent, otpTimeLeft]);

  // Real-time email validation
  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    if (value.length > 254) return 'Email is too long';
    return null;
  };

  // Real-time password validation
  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (value.length > 128) return 'Password is too long';
    if (!/[A-Za-z]/.test(value)) return 'Password must contain at least one letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return null;
  };

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
  const handleSendOtp = async () => {
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
      setCanResendOtp(false);
      setStep('verify');
      toast.success('Verification code sent to your email!', {
        icon: <Mail className="w-5 h-5" />,
        duration: 4000
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send code. Please check if the email is registered.';
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
  const handleVerifyOtp = async () => {
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
      toast.success('Code verified! Please set your new password.', {
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
      setCanResendOtp(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
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
      toast.success('Password reset successful! Please login with your new password.', {
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
    <div className="min-h-screen bg-gradient-to-br from-themeLight via-white to-themeSoft text-themeDeep flex font-geist overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-themeSoft/60 to-themePrimary/20 rounded-full filter blur-[120px] opacity-70" />
        <motion.div animate={{ x: [0, -80, 0], y: [0, 100, 0], scale: [1, 1.2, 1] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-gradient-to-tl from-themeMedium/40 to-themePrimary/10 rounded-full filter blur-[150px] opacity-50" />
      </div>

      <div className="container mx-auto flex z-10">
        {/* Left Side: Branding */}
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="hidden lg:flex w-1/2 flex-col justify-center p-8 xl:p-20">
          <Link to="/" className="flex items-center gap-4 mb-16 group">
            <motion.div whileHover={{ rotate: 180, scale: 1.1 }} transition={{ duration: 0.5 }} className="w-12 h-12 bg-gradient-to-br from-themePrimary to-themeDark rounded-2xl flex items-center justify-center shadow-neon group-hover:shadow-neon-hover">
              <Activity className="text-white w-6 h-6" />
            </motion.div>
            <span className="text-3xl font-black tracking-tighter text-themeDeep italic group-hover:text-themePrimary transition-colors">MediConnect</span>
          </Link>

          <div className="space-y-8">
            <h1 className="text-5xl xl:text-7xl font-black text-themeDeep leading-[1.1] tracking-tighter">
              Reset Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-themePrimary to-themeDark">Secure Access.</span>
            </h1>
            <p className="text-lg xl:text-xl text-themeDark/70 font-medium max-w-md leading-relaxed">
              Verify your identity with a secure OTP sent to your registered email. HIPAA-compliant password recovery.
            </p>

            <div className="space-y-4 pt-8">
              {[
                { icon: Shield, label: 'Secure Verification', desc: '6-digit OTP protection' },
                { icon: Key, label: 'Instant Reset', desc: 'Set new password immediately' },
                { icon: Zap, label: 'Encrypted Process', desc: 'End-to-end encryption' },
              ].map((feature, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + idx * 0.1 }} className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
                  <div className="p-3 bg-themeSoft rounded-xl">
                    <feature.icon className="w-6 h-6 text-themePrimary" />
                  </div>
                  <div>
                    <p className="font-black text-themeDeep">{feature.label}</p>
                    <p className="text-sm text-themeDark/60 font-medium">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-8">
              {[
                { value: '60s', label: 'OTP Validity', icon: RefreshCw },
                { value: '<30s', label: 'Delivery Time', icon: Zap },
              ].map((stat, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + idx * 0.1 }} className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-glass">
                  <stat.icon className="w-6 h-6 text-themePrimary mb-2" />
                  <p className="text-2xl font-black text-themeDeep">{stat.value}</p>
                  <p className="text-xs font-black text-themeDark/60 uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/50 p-8 sm:p-12 rounded-[2.5rem] shadow-premium relative overflow-hidden">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-themePrimary to-themeDark rounded-xl flex items-center justify-center shadow-neon">
                  <Activity className="text-white w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-themeDeep">MediConnect</span>
              </Link>
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-themeDeep tracking-tighter italic">
                {step === 'email' && 'Forgot Password'}
                {step === 'verify' && 'Verify Identity'}
                {step === 'reset' && 'New Password'}
              </h2>
              <p className="text-xs font-black text-themeDark/40 uppercase tracking-[0.2em] mt-2">
                {step === 'email' && 'Enter your registered email'}
                {step === 'verify' && 'Check your email for code'}
                {step === 'reset' && 'Create a strong password'}
                {deviceFingerprint && ` • ${deviceFingerprint.slice(0, 8)}`}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2">
                {[
                  { step: 'email', icon: Mail },
                  { step: 'verify', icon: Key },
                  { step: 'reset', icon: Lock }
                ].map((s, idx) => (
                  <React.Fragment key={s.step}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      step === s.step || (step === 'verify' && s.step === 'email') || (step === 'reset' && (s.step === 'email' || s.step === 'verify'))
                        ? 'bg-themePrimary text-white shadow-neon'
                        : 'bg-themeMedium/30 text-themeDark/40'
                    }`}>
                      <s.icon size={18} />
                    </div>
                    {idx < 2 && (
                      <div className={`w-8 h-0.5 transition-all ${
                        step === 'reset' || (step === 'verify' && idx === 0)
                          ? 'bg-themePrimary'
                          : 'bg-themeMedium/30'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <form onSubmit={step === 'reset' ? handleResetPassword : undefined} className="space-y-5">
              {errors.submit && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold text-center flex items-center justify-center gap-2">
                  <Shield size={16} /> {errors.submit}
                </motion.div>
              )}

              {/* Step 1: Email */}
              {step === 'email' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-themeDeep uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group/input">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : touched.email && !errors.email ? 'text-green-500' : 'text-themeDark/40 group-focus-within/input:text-themePrimary'}`}>
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={() => handleBlur('email')}
                      className={`w-full bg-themeLight/50 border-2 rounded-2xl pl-12 pr-12 py-4 text-themeDeep font-bold placeholder-themeDark/30 focus:outline-none focus:border-themePrimary focus:bg-white focus:ring-4 focus:ring-themePrimary/10 transition-all shadow-inner ${errors.email ? 'border-red-400 ring-4 ring-red-400/10' : touched.email && !errors.email ? 'border-green-400' : 'border-themeMedium/30'}`}
                      placeholder="name@medical.gov"
                      autoComplete="email"
                    />
                    {touched.email && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {!errors.email ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                    )}
                  </div>
                  {errors.email && <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.email}</motion.p>}
                </div>
              )}

              {/* Step 2: OTP Verification */}
              {step === 'verify' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-themeDark/70 mb-2">
                      We sent a 6-digit code to <span className="font-bold text-themePrimary">{email}</span>
                    </p>
                    <p className="text-xs font-bold text-themeDark/50 uppercase tracking-wide">
                      Check your inbox and enter the code below
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-themeDeep uppercase tracking-widest ml-1 text-center block">Enter 6-Digit Code</label>
                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, index) => (
                        <motion.input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={index === 0 ? handleOtpPaste : undefined}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-black border-2 rounded-xl bg-themeLight/50 focus:outline-none focus:bg-white focus:border-themePrimary focus:ring-4 focus:ring-themePrimary/10 transition-all shadow-inner border-themeMedium/30"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-center">
                    <p className="text-xs font-bold text-themeDark/60">Didn't receive code?</p>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResendOtp || isSubmitting}
                      className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${canResendOtp && !isSubmitting ? 'text-themePrimary hover:underline' : 'text-themeDark/40 cursor-not-allowed'}`}
                    >
                      {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}><RefreshCw size={12} /></motion.div> : <RefreshCw size={12} />}
                      {canResendOtp ? 'Resend' : formatTime(otpTimeLeft)}
                    </button>
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isSubmitting || !otp.every(d => d !== '')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-themePrimary to-themeDeep text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-neon hover:shadow-neon-hover transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Key size={20} />
                    VERIFY CODE
                  </motion.button>
                </div>
              )}

              {/* Step 3: Reset Password */}
              {step === 'reset' && (
                <>
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-themeDeep uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative group/input">
                      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : touched.password && !errors.password ? 'text-green-500' : 'text-themeDark/40 group-focus-within/input:text-themePrimary'}`}>
                        <Lock size={20} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={handlePasswordChange}
                        onBlur={() => handleBlur('password')}
                        className={`w-full bg-themeLight/50 border-2 rounded-2xl pl-12 pr-12 py-4 text-themeDeep font-bold placeholder-themeDark/30 focus:outline-none focus:border-themePrimary focus:bg-white focus:ring-4 focus:ring-themePrimary/10 transition-all shadow-inner ${errors.password ? 'border-red-400 ring-4 ring-red-400/10' : touched.password && !errors.password ? 'border-green-400' : 'border-themeMedium/30'}`}
                        placeholder="••••••••••••"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-themeDark/40 hover:text-themePrimary transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {password && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < passwordStrength.passed ? passwordStrength.percentage < 40 ? 'bg-red-500' : passwordStrength.percentage < 80 ? 'bg-yellow-500' : 'bg-green-500' : 'bg-themeMedium/30'}`} />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { test: password.length >= 8, label: '8+ chars' },
                            { test: /[A-Z]/.test(password), label: 'Uppercase' },
                            { test: /[a-z]/.test(password), label: 'Lowercase' },
                            { test: /[0-9]/.test(password), label: 'Number' },
                            { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'Symbol' },
                          ].map((req, i) => (
                            <span key={i} className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-all ${req.test ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-themeMedium/20 text-themeDark/50'}`}>
                              {req.label}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {errors.password && <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.password}</motion.p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-themeDeep uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative group/input">
                      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.confirmPassword ? 'text-red-400' : touched.confirmPassword && !errors.confirmPassword ? 'text-green-500' : 'text-themeDark/40 group-focus-within/input:text-themePrimary'}`}>
                        <Lock size={20} />
                      </div>
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
                        className={`w-full bg-themeLight/50 border-2 rounded-2xl pl-12 pr-12 py-4 text-themeDeep font-bold placeholder-themeDark/30 focus:outline-none focus:border-themePrimary focus:bg-white focus:ring-4 focus:ring-themePrimary/10 transition-all shadow-inner ${errors.confirmPassword ? 'border-red-400 ring-4 ring-red-400/10' : touched.confirmPassword && !errors.confirmPassword ? 'border-green-400' : 'border-themeMedium/30'}`}
                        placeholder="••••••••••••"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-themeDark/40 hover:text-themePrimary transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.confirmPassword}</motion.p>}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting || !password || !confirmPassword || password !== confirmPassword}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-themePrimary to-themeDeep text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-neon hover:shadow-neon-hover transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock size={20} />
                    RESET PASSWORD
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </motion.button>
                </>
              )}
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-themeSoft/30 rounded-xl border border-themePrimary/20">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-themePrimary mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-themePrimary uppercase tracking-widest mb-1">Security Notice</p>
                  <p className="text-xs text-themeDark/70 font-medium">
                    For your security, the verification code expires in 60 seconds. Never share your code with anyone.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-bold text-themeDark/60 hover:text-themePrimary transition-colors flex items-center justify-center gap-2">
                <ArrowRight size={16} className="rotate-180" />
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
