import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, ShieldCheck, Mail, Lock, User, UserCheck, ArrowRight, Sparkles, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Fingerprint, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput } from '../utils/validation';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api/axios';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('patient');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [deviceFingerprint, setDeviceFingerprint] = useState('');

  const { register, setSession } = useContext(AuthContext);
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

  // Real-time name validation
  const validateName = useCallback((value) => {
    if (!value || value.trim().length === 0) return 'Name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    if (value.trim().length > 100) return 'Name is too long';
    if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    return null;
  }, []);

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

  // Handle name change with real-time validation
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      setErrors(prev => ({ ...prev, name: validateName(value) }));
    }
  };

  // Handle email change with real-time validation
  const handleEmailChange = (e) => {
    const value = e.target.value.toLowerCase().trim();
    setEmail(value);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    }
  };

  // Handle password change with real-time validation
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

  // Handle blur for validation trigger
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'name') {
      setErrors(prev => ({ ...prev, name: validateName(name) }));
    } else if (field === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }));
    }
  };

  // Password strength calculator
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Mark all fields as touched
    setTouched({ name: true, email: true, password: true });

    // Validate all fields
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (nameError || emailError || passwordError) {
      setErrors({
        name: nameError,
        email: emailError,
        password: passwordError
      });
      setIsSubmitting(false);
      toast.error('Please fix the errors above before continuing', {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 4000
      });
      return;
    }

    const loadToast = toast.loading('Creating your secure account...');
    try {
      await register(sanitizeInput(name), sanitizeInput(email), password, role);
      toast.success('Account created! Please check your email for verification code.', {
        id: loadToast,
        icon: '🎉',
        duration: 4000
      });
      // Redirect to verification page with email
      navigate('/verify-email', {
        replace: true,
        state: { email: sanitizeInput(email) }
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your data.';
      toast.error(msg, {
        id: loadToast,
        icon: <ShieldCheck className="w-5 h-5" />,
        duration: 5000
      });
      setErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
        setIsSubmitting(true);
        try {
            const res = await api.post('/api/auth/google', {
                credential: credentialResponse.access_token,
                role // use selected role
            });
            
            toast.success('Signed in with Google successfully!', {
                icon: '🎉',
                duration: 3000
            });

            const token = res.data.token || res.data.accessToken;
            if (token && res.data.user) {
                setSession(res.data.user, token);
            }

            if (res.data.user.role === 'patient') navigate('/patient');
            else if (res.data.user.role === 'doctor') navigate('/doctor');
            else if (res.data.user.role === 'admin') navigate('/admin');
        } catch (err) {
            console.error('Google Auth Error:', err);
            toast.error('Google Registration failed. Please try again or use email registration.');
        } finally {
            setIsSubmitting(false);
        }
    },
    onError: () => toast.error('Google authorization failed'),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-themeLight via-white to-themeSoft text-themeDeep flex font-geist overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-themeSoft/60 to-themePrimary/20 rounded-full filter blur-[120px] opacity-70"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 100, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-gradient-to-tl from-themeMedium/40 to-themePrimary/10 rounded-full filter blur-[150px] opacity-50"
        />
      </div>

      <div className="container mx-auto flex z-10">
        {/* Left Side: Branding & Info */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex w-1/2 flex-col justify-center p-8 xl:p-20"
        >
          <Link to="/" className="flex items-center gap-4 mb-16 group">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 bg-gradient-to-br from-themePrimary to-themeDark rounded-2xl flex items-center justify-center shadow-neon group-hover:shadow-neon-hover"
            >
              <ShieldCheck className="text-white w-6 h-6" />
            </motion.div>
            <span className="text-3xl font-black tracking-tighter text-themeDeep italic group-hover:text-themePrimary transition-colors">MediConnect</span>
          </Link>

          <div className="space-y-8">
            <h1 className="text-5xl xl:text-7xl font-black text-themeDeep leading-[1.1] tracking-tighter">
              Join the<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-themePrimary to-themeDark">Healthcare Revolution.</span>
            </h1>
            <p className="text-lg xl:text-xl text-themeDark/70 font-medium max-w-md leading-relaxed">
              Become part of a decentralized, AI-enhanced medical network. HIPAA-compliant security with instant provider access.
            </p>

            {/* Security Features */}
            <div className="space-y-4 pt-8">
              {[
                { icon: ShieldCheck, label: 'HIPAA Compliant', desc: 'Enterprise healthcare standards' },
                { icon: Fingerprint, label: 'Device Verification', desc: 'Multi-layer authentication' },
                { icon: Zap, label: 'Instant Access', desc: 'Get started in under 60 seconds' },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm"
                >
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

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              {[
                { value: '<60s', label: 'Setup Time', icon: Activity },
                { value: '256-bit', label: 'Encryption', icon: ShieldCheck },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-glass"
                >
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-xl bg-white/80 backdrop-blur-2xl border border-white/50 p-8 sm:p-12 rounded-[2.5rem] shadow-premium relative overflow-hidden"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-themePrimary to-themeDark rounded-xl flex items-center justify-center shadow-neon">
                  <ShieldCheck className="text-white w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-themeDeep">MediConnect</span>
              </Link>
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-themeDeep tracking-tighter italic">Create Account</h2>
              <p className="text-xs font-black text-themeDark/40 uppercase tracking-[0.2em] mt-2">
                Initialize Secure Profile {deviceFingerprint && `• ${deviceFingerprint.slice(0, 8)}`}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold text-center flex items-center justify-center gap-2"
                >
                  <AlertCircle size={16} />
                  {errors.submit}
                </motion.div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-themeDeep uppercase tracking-widest ml-1">
                  Full Name
                  {touched.name && !errors.name && <CheckCircle className="inline w-4 h-4 text-green-500 ml-2" />}
                  {touched.name && errors.name && <XCircle className="inline w-4 h-4 text-red-500 ml-2" />}
                </label>
                <div className="relative group/input">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.name ? 'text-red-400' : touched.name && !errors.name ? 'text-green-500' : 'text-themeDark/40 group-focus-within/input:text-themePrimary'
                  }`}>
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={handleNameChange}
                    onBlur={() => handleBlur('name')}
                    className={`w-full bg-themeLight/50 border-2 rounded-2xl pl-12 pr-12 py-4 text-themeDeep font-bold placeholder-themeDark/30 focus:outline-none focus:border-themePrimary focus:bg-white focus:ring-4 focus:ring-themePrimary/10 transition-all shadow-inner ${
                      errors.name ? 'border-red-400 ring-4 ring-red-400/10' :
                      touched.name && !errors.name ? 'border-green-400' :
                      'border-themeMedium/30'
                    }`}
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                  {touched.name && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {!errors.name ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1"
                  >
                    <AlertCircle size={12} /> {errors.name}
                  </motion.p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-themeDeep uppercase tracking-widest ml-1">
                  Email Address
                  {touched.email && !errors.email && <CheckCircle className="inline w-4 h-4 text-green-500 ml-2" />}
                  {touched.email && errors.email && <XCircle className="inline w-4 h-4 text-red-500 ml-2" />}
                </label>
                <div className="relative group/input">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.email ? 'text-red-400' : touched.email && !errors.email ? 'text-green-500' : 'text-themeDark/40 group-focus-within/input:text-themePrimary'
                  }`}>
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => handleBlur('email')}
                    className={`w-full bg-themeLight/50 border-2 rounded-2xl pl-12 pr-12 py-4 text-themeDeep font-bold placeholder-themeDark/30 focus:outline-none focus:border-themePrimary focus:bg-white focus:ring-4 focus:ring-themePrimary/10 transition-all shadow-inner ${
                      errors.email ? 'border-red-400 ring-4 ring-red-400/10' :
                      touched.email && !errors.email ? 'border-green-400' :
                      'border-themeMedium/30'
                    }`}
                    placeholder="name@medical.gov"
                    autoComplete="email"
                  />
                  {touched.email && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {!errors.email ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1"
                  >
                    <AlertCircle size={12} /> {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-themeDeep uppercase tracking-widest ml-1">Password</label>
                <div className="relative group/input">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.password ? 'text-red-400' : touched.password && !errors.password ? 'text-green-500' : 'text-themeDark/40 group-focus-within/input:text-themePrimary'
                  }`}>
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    className={`w-full bg-themeLight/50 border-2 rounded-2xl pl-12 pr-12 py-4 text-themeDeep font-bold placeholder-themeDark/30 focus:outline-none focus:border-themePrimary focus:bg-white focus:ring-4 focus:ring-themePrimary/10 transition-all shadow-inner ${
                      errors.password ? 'border-red-400 ring-4 ring-red-400/10' :
                      touched.password && !errors.password ? 'border-green-400' :
                      'border-themeMedium/30'
                    }`}
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
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            i < passwordStrength.passed
                              ? passwordStrength.percentage < 40 ? 'bg-red-500' : passwordStrength.percentage < 80 ? 'bg-yellow-500' : 'bg-green-500'
                              : 'bg-themeMedium/30'
                          }`}
                        />
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
                        <span
                          key={i}
                          className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-all ${
                            req.test ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-themeMedium/20 text-themeDark/50'
                          }`}
                        >
                          {req.label}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1"
                  >
                    <AlertCircle size={12} /> {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-black text-themeDeep uppercase tracking-widest ml-1 flex items-center gap-2">
                  Select Role
                  <Sparkles size={14} className="text-themePrimary animate-pulse" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    type="button"
                    onClick={() => setRole('patient')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`py-4 rounded-2xl border-2 font-black transition-all duration-300 shadow-sm flex flex-col items-center gap-2 ${
                      role === 'patient'
                        ? 'bg-themeSoft/50 text-themePrimary border-themePrimary shadow-neon'
                        : 'bg-transparent text-gray-400 border-themeMedium/20 hover:border-themeMedium'
                    }`}
                  >
                    <User size={24} />
                    <span className="text-[10px] uppercase tracking-tighter">Patient Hub</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setRole('doctor')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`py-4 rounded-2xl border-2 font-black transition-all duration-300 shadow-sm flex flex-col items-center gap-2 ${
                      role === 'doctor'
                        ? 'bg-themeSoft/50 text-themePrimary border-themePrimary shadow-neon'
                        : 'bg-transparent text-gray-400 border-themeMedium/20 hover:border-themeMedium'
                    }`}
                  >
                    <UserCheck size={24} />
                    <span className="text-[10px] uppercase tracking-tighter">Provider Portal</span>
                  </motion.button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="w-full py-5 bg-gradient-to-r from-themePrimary to-themeDeep text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-neon hover:shadow-neon-hover transition-all group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Activity size={22} />
                      </motion.div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={22} />
                      CREATE ACCOUNT
                      <ArrowRight className="group-hover:translate-x-2 transition-transform" size={22} />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-themeDark to-themePrimary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-themeSoft/30 rounded-xl border border-themePrimary/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-themePrimary mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-themePrimary uppercase tracking-widest mb-1">Security Notice</p>
                  <p className="text-xs text-themeDark/70 font-medium">
                    Your data is protected with AES-256 encryption. By creating an account, you agree to our HIPAA-compliant security measures.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mt-6">
              <div className="flex items-center gap-4 my-6 opacity-60">
                  <div className="h-px bg-themeMedium/30 flex-1"></div>
                  <span className="text-[10px] font-black tracking-widest uppercase">Or</span>
                  <div className="h-px bg-themeMedium/30 flex-1"></div>
              </div>
              
              <div className="flex justify-center mb-6">
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

            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm font-bold text-themeDark/60">
                Already have an account?{' '}
                <Link to="/login" className="text-themePrimary font-black hover:underline uppercase tracking-widest text-[10px]">
                  Secure Login
                </Link>
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-themeSoft/50 to-transparent rounded-full blur-2xl opacity-50"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-themePrimary/20 to-transparent rounded-full blur-2xl opacity-30"></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
