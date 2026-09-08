import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
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
  const [loginAttempts, setLoginAttempts] = useState(() => {
    try {
      const stored = localStorage.getItem('loginAttempts');
      if (stored) {
        const { count, timestamp } = JSON.parse(stored);
        if ((Date.now() - timestamp) / 60000 <= 15) return count;
        localStorage.removeItem('loginAttempts');
      }
    } catch {
      // ignore
    }
    return 0;
  });

  const [lastAttemptTime, setLastAttemptTime] = useState(() => {
    try {
      const stored = localStorage.getItem('loginAttempts');
      if (stored) {
        const { timestamp } = JSON.parse(stored);
        if ((Date.now() - timestamp) / 60000 <= 15) return timestamp;
      }
    } catch {
      // ignore
    }
    return null;
  });

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

  // OTP countdown timer
  useEffect(() => {
    if (!otpSent) return;
    const interval = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResendOtp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent]);

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

  const handleVerifyOtpRef = useRef(handleVerifyOtp);
  useEffect(() => {
    handleVerifyOtpRef.current = handleVerifyOtp;
  });

  // Auto-submit OTP when all digits filled
  useEffect(() => {
    if (loginMode === 'otp' && otp.every(d => d !== '') && !isSubmitting && otpSent) {
      const timer = setTimeout(() => {
        handleVerifyOtpRef.current();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [otp, loginMode, isSubmitting, otpSent]);

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
    } catch (_err) {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-geist overflow-hidden relative selection:bg-emerald-500/30">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-teal-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto flex z-10 min-h-screen">
        {/* Left Side: Branding (Desktop) */}
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
              <Shield size={13} /> Zero-Trust Health Infrastructure
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight">
              Secure Access.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 italic">
                Healthcare Protected.
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-md leading-relaxed">
              Enterprise-grade encryption safeguards clinical records. HIPAA-compliant authentication with real-time biometric threat monitoring.
            </p>

            <div className="space-y-3 pt-4 max-w-md">
              {[
                { icon: Shield, label: 'AES-256 GCM Encryption', desc: 'Military-grade EHR vault isolation' },
                { icon: Fingerprint, label: 'Device Fingerprinting', desc: 'Active session spoofing prevention' },
                { icon: Zap, label: 'Real-Time Telemetry Audit', desc: '24/7 autonomous clinical logging' },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{feature.label}</p>
                    <p className="text-xs text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 max-w-md">
              <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80">
                <Activity className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-xl font-black text-white">99.99%</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uptime SLA</p>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80">
                <Zap className="w-5 h-5 text-teal-400 mb-2" />
                <p className="text-xl font-black text-white">&lt; 30ms</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Auth Response</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
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
            {/* Login Mode Toggle */}
            <div className="mb-6">
              <div className="flex gap-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setLoginMode('password'); setOtpSent(false); setOtp(['', '', '', '', '', '']); setErrors({}); }}
                  className={`flex-1 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    loginMode === 'password'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock size={15} /> Password
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('otp'); setOtpSent(false); setOtp(['', '', '', '', '', '']); setErrors({}); }}
                  className={`flex-1 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    loginMode === 'otp'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Key size={15} /> OTP Code
                </button>
              </div>
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {loginMode === 'password' ? 'Welcome Back' : 'OTP Direct Login'}
              </h2>
              <p className="text-xs text-slate-400 uppercase tracking-wider mt-1.5">
                {loginMode === 'password' ? 'Secure Clinical Authentication' : 'Verify with email code'}
                {deviceFingerprint && ` • ${deviceFingerprint.slice(0, 8)}`}
              </p>
            </div>

            {loginAttempts >= 3 && loginMode === 'password' && (
              <div className="mb-5 p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-2.5 text-xs text-yellow-300 font-bold">
                <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>
                  {loginAttempts >= 5 ? 'Account temporarily locked. Wait 15 minutes.' : `${5 - loginAttempts} more failed attempts will temporarily lock your account.`}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <AlertCircle size={15} /> {errors.submit}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
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
                    placeholder="name@medical.gov"
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

              {/* Password Mode */}
              {loginMode === 'password' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Password</label>
                    <Link to="/forgot-password" className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wide">Forgot?</Link>
                  </div>
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
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400 font-bold ml-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.password}
                    </p>
                  )}
                </div>
              )}

              {/* OTP Mode */}
              {loginMode === 'otp' && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSubmitting || !email || !!errors.email}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Mail size={16} />
                      Send Code To Email
                    </button>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center block">Enter 6-Digit Code</label>
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
                            canResendOtp && !isSubmitting ? 'text-emerald-400 hover:text-emerald-300 cursor-pointer' : 'text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <RefreshCw size={12} className={isSubmitting ? 'animate-spin' : ''} />
                          {canResendOtp ? 'Resend' : formatTime(otpTimeLeft)}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Submit Button */}
              {loginMode === 'password' && (
                <button
                  type="submit"
                  disabled={isSubmitting || loginAttempts >= 5}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Securing Session...
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      Secure Login
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              )}

              {loginMode === 'otp' && otpSent && (
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isSubmitting || !otp.every(d => d !== '')}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={16} />
                  Verify & Login
                </button>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Or</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {/* Google Login */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => handleGoogleAuth()}
                  className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-750 text-white px-5 py-3 rounded-xl border border-slate-700/80 text-xs font-bold tracking-wide w-full justify-center transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center pt-4 border-t border-slate-800/80">
              <p className="text-xs font-medium text-slate-400">
                New to MediConnect?{' '}
                <Link to="/register" className="text-emerald-400 font-bold hover:underline uppercase tracking-wider ml-1">
                  Create Account
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
