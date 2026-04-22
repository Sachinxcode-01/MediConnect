import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Mail, Lock, ArrowRight, Shield, Eye, EyeOff, Zap, CheckCircle, XCircle, AlertCircle, Fingerprint, Smartphone, Key, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useGoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [otpTimeLeft, setOtpTimeLeft] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  const { login, setSession, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Check for rate limiting
  useEffect(() => {
    const stored = localStorage.getItem('loginAttempts');
    if (stored) {
      const { count, timestamp } = JSON.parse(stored);
      const now = Date.now();
      const minutesPassed = (now - timestamp) / 60000;
      if (minutesPassed > 15) {
        localStorage.removeItem('loginAttempts');
      } else {
        setLoginAttempts(count);
        setLastAttemptTime(timestamp);
      }
    }
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

  // Auto-submit OTP when all digits filled
  useEffect(() => {
    if (loginMode === 'otp' && otp.every(d => d !== '') && !isSubmitting && otpSent) {
      const timer = setTimeout(() => handleVerifyOtp(), 500);
      return () => clearTimeout(timer);
    }
  }, [otp, loginMode, isSubmitting, otpSent]);

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
    return null;
  }, []);

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
    }
  };

  const checkRateLimit = () => {
    if (loginAttempts >= 5) {
      const now = Date.now();
      const minutesPassed = (now - lastAttemptTime) / 60000;
      if (minutesPassed < 15) {
        const remainingTime = Math.ceil(15 - minutesPassed);
        return { limited: true, message: `Too many failed attempts. Please try again in ${remainingTime} minutes.` };
      }
    }
    return { limited: false };
  };

  const updateLoginAttempts = (success) => {
    if (success) {
      localStorage.removeItem('loginAttempts');
      setLoginAttempts(0);
    } else {
      const newAttempts = loginAttempts + 1;
      const now = Date.now();
      localStorage.setItem('loginAttempts', JSON.stringify({ count: newAttempts, timestamp: now }));
      setLoginAttempts(newAttempts);
      setLastAttemptTime(now);
    }
  };

  // Send OTP for login
  const handleSendOtp = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await api.post('/api/auth/login-otp', { email });
      setOtpSent(true);
      setOtpTimeLeft(60);
      setCanResendOtp(false);
      toast.success('Verification code sent to your email!', {
        icon: <Mail className="w-5 h-5" />,
        duration: 4000
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send code.';
      setErrors({ submit: msg });
      toast.error(msg, {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP and login
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrors({ submit: 'Please enter the complete 6-digit code' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await api.post('/api/auth/verify-login-otp', {
        email,
        otp: otpCode,
        deviceFingerprint
      });

      updateLoginAttempts(true);
      toast.success('Login successful! Welcome back.', {
        icon: '🎉',
        duration: 3000
      });

      if (res.data.token && res.data.user) {
        setSession(res.data.user, res.data.token);
      } else if (res.data.accessToken && res.data.user) {
        setSession(res.data.user, res.data.accessToken);
      } else {
        // Fallback if needed
        localStorage.setItem('accessToken', res.data.token || res.data.accessToken);
      }

      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      updateLoginAttempts(false);
      const msg = err.response?.data?.message || err.message || 'Verification failed.';
      setErrors({ submit: msg });
      toast.error(msg, {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 5000
      });
      setOtp(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0');
      if (firstInput) firstInput.focus();
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
      await api.post('/api/auth/login-otp', { email });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setIsSubmitting(false);
      return;
    }

    const rateLimit = checkRateLimit();
    if (rateLimit.limited) {
      setErrors({ submit: rateLimit.message });
      setIsSubmitting(false);
      return;
    }

    try {
      await login(email, password, deviceFingerprint);
      updateLoginAttempts(true);
      toast.success('Access granted! Welcome back.', {
        icon: '🎉',
        duration: 3000
      });

      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      updateLoginAttempts(false);
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.message || 'Authentication failed.';
      const remainingAttempts = 5 - loginAttempts - 1;
      const securityMsg = remainingAttempts > 0
        ? `${msg} (${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining)`
        : msg;
      toast.error(securityMsg, {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 5000
      });
      setErrors({ submit: securityMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'patient') navigate('/patient');
      else if (user.role === 'doctor') navigate('/doctor');
      else if (user.role === 'admin') navigate('/admin');
    }
  }, [user, navigate]);

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
        setIsSubmitting(true);
        try {
            const res = await api.post('/api/auth/google', {
                credential: credentialResponse.access_token,
                role: 'patient'
            });
            
            toast.success('Signed in with Google successfully!', {
                icon: '🎉',
                duration: 3000
            });

            const token = res.data.token || res.data.accessToken;
            if (token && res.data.user) {
                setSession(res.data.user, token);
            }

            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err) {
            console.error('Google Auth Error:', err);
            toast.error('Google Sign-In failed. Please try again or use email login.');
        } finally {
            setIsSubmitting(false);
        }
    },
    onError: () => toast.error('Google authorization failed'),
  });


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
              Secure Access.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-themePrimary to-themeDark">Healthcare Protected.</span>
            </h1>
            <p className="text-lg xl:text-xl text-themeDark/70 font-medium max-w-md leading-relaxed">
              Enterprise-grade encryption protects your medical data. HIPAA compliant authentication with real-time threat detection.
            </p>

            <div className="space-y-4 pt-8">
              {[
                { icon: Shield, label: 'AES-256 Encryption', desc: 'Military-grade data protection' },
                { icon: Fingerprint, label: 'Device Fingerprinting', desc: 'Unauthorized access detection' },
                { icon: Zap, label: 'Real-time Monitoring', desc: '24/7 threat detection active' },
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
                { value: '99.9%', label: 'Uptime SLA', icon: Activity },
                { value: '<50ms', label: 'Auth Response', icon: Zap },
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

            {/* Login Mode Toggle */}
            <div className="mb-6">
              <div className="flex gap-2 p-1 bg-themeLight/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setLoginMode('password'); setOtpSent(false); setOtp(['', '', '', '', '', '']); setErrors({}); }}
                  className={`flex-1 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    loginMode === 'password'
                      ? 'bg-white text-themePrimary shadow-md'
                      : 'text-themeDark/50 hover:text-themeDark'
                  }`}
                >
                  <Lock size={16} /> Password
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('otp'); setOtpSent(false); setOtp(['', '', '', '', '', '']); setErrors({}); }}
                  className={`flex-1 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    loginMode === 'otp'
                      ? 'bg-white text-themePrimary shadow-md'
                      : 'text-themeDark/50 hover:text-themeDark'
                  }`}
                >
                  <Key size={16} /> OTP Code
                </button>
              </div>
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-themeDeep tracking-tighter italic">
                {loginMode === 'password' ? 'Welcome Back' : 'OTP Login'}
              </h2>
              <p className="text-xs font-black text-themeDark/40 uppercase tracking-[0.2em] mt-2">
                {loginMode === 'password' ? 'Secure Authentication' : 'Verify with email code'} {deviceFingerprint && `• Device: ${deviceFingerprint.slice(0, 8)}`}
              </p>
            </div>

            {loginAttempts >= 3 && loginMode === 'password' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm font-bold text-yellow-800">
                  {loginAttempts >= 5 ? 'Account temporarily locked. Wait 15 minutes.' : `${5 - loginAttempts} more failed attempts will lock your account.`}
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.submit && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold text-center flex items-center justify-center gap-2">
                  <Shield size={16} /> {errors.submit}
                </motion.div>
              )}

              {/* Email Field */}
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

              {/* Password Mode */}
              {loginMode === 'password' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-black text-themeDeep uppercase tracking-widest">Password</label>
                    <Link to="/forgot-password" className="text-[10px] font-black text-themePrimary hover:underline uppercase tracking-wide">Forgot?</Link>
                  </div>
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
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-themeDark/40 hover:text-themePrimary transition-colors">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.password}</motion.p>}
                </div>
              )}

              {/* OTP Mode */}
              {loginMode === 'otp' && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <motion.button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSubmitting || !email || !!errors.email}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-themePrimary to-themeDeep text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-neon hover:shadow-neon-hover transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mail size={20} />
                      SEND CODE TO EMAIL
                    </motion.button>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}

              {/* Submit Button */}
              {loginMode === 'password' && (
                <motion.button
                  type="submit"
                  disabled={isSubmitting || loginAttempts >= 5}
                  whileHover={{ scale: isSubmitting || loginAttempts >= 5 ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting || loginAttempts >= 5 ? 1 : 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-themePrimary to-themeDeep text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-neon hover:shadow-neon-hover transition-all group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Activity size={20} /></motion.div>
                        Securing Session...
                      </>
                    ) : (
                      <>
                        <Shield size={20} />
                        SECURE LOGIN
                        <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
                      </>
                    )}
                  </span>
                </motion.button>
              )}

              {loginMode === 'otp' && otpSent && (
                <motion.button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isSubmitting || !otp.every(d => d !== '')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-themePrimary to-themeDeep text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-neon hover:shadow-neon-hover transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} />
                  VERIFY & LOGIN
                </motion.button>
              )}
              
              {/* Divider */}
              <div className="flex items-center gap-4 my-6 opacity-60">
                  <div className="h-px bg-themeMedium/30 flex-1"></div>
                  <span className="text-[10px] font-black tracking-widest uppercase">Or</span>
                  <div className="h-px bg-themeMedium/30 flex-1"></div>
              </div>

              {/* Google Login */}
              <div className="flex justify-center -mt-2">
                 <button
                    type="button"
                    onClick={() => handleGoogleAuth()}
                    className="flex items-center gap-3 bg-white text-gray-700 px-6 py-3 rounded-full hover:bg-gray-50 hover:shadow-lg transition-all duration-300 font-bold tracking-wide w-full max-w-[280px] justify-center border border-gray-200"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Continue with Google
                  </button>
              </div>

            </form>


            {/* Security Notice */}
            <div className="mt-6 p-4 bg-themeSoft/30 rounded-xl border border-themePrimary/20">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-themePrimary mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-themePrimary uppercase tracking-widest mb-1">Security Notice</p>
                  <p className="text-xs text-themeDark/70 font-medium">
                    Your login is protected with AES-256 encryption. Failed attempts are logged for your protection.
                  </p>
                </div>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm font-bold text-themeDark/60">
                New to MediConnect?{' '}
                <Link to="/register" className="text-themePrimary font-black hover:underline uppercase tracking-widest text-[10px]">
                  Create Secure Account
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
