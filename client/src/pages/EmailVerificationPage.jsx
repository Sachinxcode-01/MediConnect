import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, ShieldCheck, Mail, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Zap, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email] = useState(() => location.state?.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors({});

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.split('');
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(digits.length, 5);
    const nextInput = document.getElementById(`otp-${nextIndex}`);
    if (nextInput) nextInput.focus();
  };

  const handleSubmit = useCallback(async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrors({ submit: 'Please enter the complete 6-digit code' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await api.post('/api/auth/verify-email', {
        email,
        otp: otpCode
      });

      toast.success('Email verified successfully! Welcome to MediConnect.', {
        icon: '🎉',
        duration: 4000
      });

      if (res.data.token) {
        localStorage.setItem('accessToken', res.data.token);
      }

      const role = res.data.user?.role;
      if (role === 'patient') navigate('/patient', { replace: true });
      else if (role === 'doctor') navigate('/doctor', { replace: true });
      else if (role === 'admin') navigate('/admin', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      const msg = err.message || err.response?.data?.message || 'Verification failed. Please try again.';
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
  }, [otp, email, navigate]);

  const handleResend = async () => {
    if (!canResend) return;

    setIsResending(true);
    setErrors({});

    try {
      await api.post('/api/auth/resend-verification', { email });
      toast.success('Verification code resent! Please check your inbox.', {
        icon: <Mail className="w-5 h-5" />,
        duration: 4000
      });
      setTimeLeft(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      const msg = err.message || err.response?.data?.message || 'Failed to resend code.';
      toast.error(msg, {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 4000
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-geist overflow-hidden relative selection:bg-emerald-500/30">
      {/* Dynamic Background Glows */}
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
              <Lock size={13} /> Two-Factor Patient Authentication
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight">
              Verify Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 italic">
                Email Address
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-md leading-relaxed">
              We dispatched an authentication code to your email. Enter it below to unlock your encrypted health records and telehealth portal.
            </p>

            {/* Trust Badges */}
            <div className="space-y-3 pt-6 max-w-md">
              {[
                { icon: Lock, label: 'Encrypted Verification', desc: 'Single-use cryptographic pin code' },
                { icon: Zap, label: 'Instant Triage Access', desc: 'Immediate clinical room connectivity' },
                { icon: ShieldCheck, label: 'HIPAA & GDPR Compliant', desc: 'Zero-trust protected telemetry' },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80"
                >
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
          </div>
        </motion.div>

        {/* Right Side: Verification Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-8">
          {/* Mobile Brand Link */}
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
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <Mail className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Security Verification</h2>
              <p className="text-xs text-slate-400 mt-2">
                Enter the 6-digit code delivered to:
              </p>
              <p className="text-sm font-bold text-emerald-400 break-all mt-1">{email}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
              {errors.submit && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <AlertCircle size={15} />
                  {errors.submit}
                </div>
              )}

              {/* OTP Digits Grid */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center block">
                  6-Digit Clinical Passcode
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
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-xl bg-slate-950/70 border border-slate-750 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || otp.some(d => d === '')}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Verify Code
                    <CheckCircle size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Resend Code Strip */}
            <div className="mt-6 text-center space-y-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="text-slate-400">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || isResending}
                  className={`font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                    canResend && !isResending
                      ? 'text-emerald-400 hover:text-emerald-300 cursor-pointer'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw size={12} className={isResending ? 'animate-spin' : ''} />
                  {isResending ? 'Sending...' : 'Resend'}
                </button>
              </div>

              {!canResend && (
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                  <Lock size={12} />
                  Resend available in <span className="text-emerald-400 font-bold">{formatTime(timeLeft)}</span>
                </p>
              )}
            </div>

            {/* Back to Register Link */}
            <div className="mt-5 text-center">
              <Link
                to="/register"
                className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft size={14} />
                Back to Registration
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
