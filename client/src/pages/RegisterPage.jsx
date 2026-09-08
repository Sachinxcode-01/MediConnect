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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-geist overflow-hidden relative selection:bg-emerald-500/30">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-teal-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto flex z-10 min-h-screen">
        {/* Left Side: Branding & Info (Desktop) */}
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
              <Sparkles size={13} /> Connected Health Protocol
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight">
              Join the<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 italic">
                Healthcare Network.
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-md leading-relaxed">
              Experience unified AI triage, encrypted electronic health records, and real-time telehealth consultations in one zero-trust platform.
            </p>

            <div className="space-y-3 pt-4 max-w-md">
              {[
                { icon: ShieldCheck, label: 'HIPAA & GDPR Compliant', desc: 'Hardware-grade biometric privacy' },
                { icon: Fingerprint, label: 'Cryptographic Identity', desc: 'Single-identity medical ledger' },
                { icon: Zap, label: 'Instant Clinical Onboarding', desc: 'Connect to licensed doctors in seconds' },
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
                <p className="text-xl font-black text-white">&lt; 60s</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Setup Time</p>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80">
                <ShieldCheck className="w-5 h-5 text-teal-400 mb-2" />
                <p className="text-xl font-black text-white">256-bit</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AES Encryption</p>
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
            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Account</h2>
              <p className="text-xs text-slate-400 uppercase tracking-wider mt-1.5">
                Initialize Secure Health Profile {deviceFingerprint && `• ${deviceFingerprint.slice(0, 8)}`}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <AlertCircle size={15} /> {errors.submit}
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={handleNameChange}
                    onBlur={() => handleBlur('name')}
                    className={`w-full bg-slate-950/60 border rounded-xl pl-11 pr-11 py-3.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                      errors.name ? 'border-red-500/50' : touched.name && !errors.name ? 'border-emerald-500/50' : 'border-slate-800'
                    }`}
                    placeholder="Dr. John Doe"
                    autoComplete="name"
                  />
                  {touched.name && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {!errors.name ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    </div>
                  )}
                </div>
                {errors.name && (
                  <p className="text-xs text-red-400 font-bold ml-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.name}
                  </p>
                )}
              </div>

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
                    placeholder="user@hospital.org"
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

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

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

                {errors.password && (
                  <p className="text-xs text-red-400 font-bold ml-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.password}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      role === 'patient'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <User size={16} /> Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      role === 'doctor'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <UserCheck size={16} /> Doctor
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Activity className="animate-spin" size={16} />
                    Registering Account...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Create Account
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Or</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {/* Google Register */}
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
                  Register with Google
                </button>
              </div>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center pt-4 border-t border-slate-800/80">
              <p className="text-xs font-medium text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="text-emerald-400 font-bold hover:underline uppercase tracking-wider ml-1">
                  Sign In
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
