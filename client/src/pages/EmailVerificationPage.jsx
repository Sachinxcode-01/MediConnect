import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, ShieldCheck, Mail, CheckCircle, XCircle, AlertCircle, ArrowLeft, RefreshCw, Zap, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const EmailVerificationPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(60); // Cooldown timer
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state or redirect
  useEffect(() => {
    const userEmail = location.state?.email;
    if (!userEmail) {
      navigate('/register', { replace: true });
      return;
    }
    setEmail(userEmail);
  }, [location, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-submit when all OTP fields are filled
  useEffect(() => {
    if (otp.every(digit => digit !== '') && !isSubmitting) {
      const timer = setTimeout(() => {
        handleSubmit();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [otp]);

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow numbers
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

    // Focus on next empty input or last input
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

      // Store token and redirect
      if (res.data.token) {
        localStorage.setItem('accessToken', res.data.token);
      }

      // Redirect based on role
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
      // Clear OTP on error
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
      toast.success('Verification code resent! Please check your email.', {
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
    <div className="min-h-screen bg-gradient-to-br from-themeLight via-white to-themeSoft text-themeDeep flex font-geist overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] bg-gradient-to-br from-themePrimary/30 to-themeSoft/40 rounded-full filter blur-[100px] opacity-60"
        />
        <motion.div
          animate={{ x: [0, -60, 0], y: [0, 80, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] bg-gradient-to-tl from-themeMedium/30 to-themePrimary/15 rounded-full filter blur-[120px] opacity-50"
        />
      </div>

      <div className="container mx-auto flex z-10">
        {/* Left Side: Info */}
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
              Verify Your<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-themePrimary to-themeDark">Email Address</span>
            </h1>
            <p className="text-lg xl:text-xl text-themeDark/70 font-medium max-w-md leading-relaxed">
              We've sent a 6-digit verification code to your email. Enter it below to activate your secure healthcare account.
            </p>

            {/* Security Features */}
            <div className="space-y-4 pt-8">
              {[
                { icon: Lock, label: 'Secure Verification', desc: '6-digit code expires in 10 minutes' },
                { icon: Zap, label: 'Instant Access', desc: 'Get started immediately after verification' },
                { icon: ShieldCheck, label: 'HIPAA Compliant', desc: 'Your data is protected end-to-end' },
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
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/50 p-8 sm:p-12 rounded-[2.5rem] shadow-premium relative overflow-hidden"
          >
            {/* Header */}
            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-themePrimary/20 to-themeSoft/40 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-themePrimary/30"
              >
                <Mail className="w-10 h-10 text-themePrimary" />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-black text-themeDeep tracking-tighter italic">Verification Code</h2>
              <p className="text-xs font-black text-themeDark/40 uppercase tracking-[0.2em] mt-2">
                Enter the 6-digit code sent to
              </p>
              <p className="text-sm font-bold text-themePrimary mt-1">{email}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
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

              {/* OTP Inputs */}
              <div className="space-y-3">
                <label className="text-xs font-black text-themeDeep uppercase tracking-widest ml-1 text-center block">
                  Enter Verification Code
                </label>
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
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black border-2 rounded-xl bg-themeLight/50 focus:outline-none focus:bg-white transition-all shadow-inner ${
                        errors.submit
                          ? 'border-red-400 ring-4 ring-red-400/10 focus:border-themePrimary'
                          : 'border-themeMedium/30 focus:border-themePrimary focus:ring-4 focus:ring-themePrimary/10'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting || otp.some(d => d === '')}
                whileHover={{ scale: isSubmitting || otp.some(d => d === '') ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting || otp.some(d => d === '') ? 1 : 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-themePrimary to-themeDeep text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-neon hover:shadow-neon-hover transition-all group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Activity size={20} />
                      </motion.div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} />
                      VERIFY EMAIL
                      <CheckCircle className="group-hover:scale-110 transition-transform" size={20} />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-themeDark to-themePrimary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.button>
            </form>

            {/* Resend Code */}
            <div className="mt-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm font-bold text-themeDark/60">Didn't receive the code?</p>
                <motion.button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || isResending}
                  whileHover={{ scale: canResend && !isResending ? 1.05 : 1 }}
                  whileTap={{ scale: canResend && !isResending ? 0.95 : 1 }}
                  className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                    canResend && !isResending
                      ? 'text-themePrimary hover:underline cursor-pointer'
                      : 'text-themeDark/40 cursor-not-allowed'
                  }`}
                >
                  {isResending ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw size={12} />
                      </motion.div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={12} />
                      Resend
                    </>
                  )}
                </motion.button>
              </div>

              {!canResend && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs font-bold text-themeDark/50 flex items-center justify-center gap-2"
                >
                  <Lock size={12} />
                  Resend available in <span className="text-themePrimary font-black">{formatTime(timeLeft)}</span>
                </motion.p>
              )}
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-themeSoft/30 rounded-xl border border-themePrimary/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-themePrimary mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-themePrimary uppercase tracking-widest mb-1">Security Notice</p>
                  <p className="text-xs text-themeDark/70 font-medium">
                    For your security, the verification code expires in 10 minutes. Never share this code with anyone.
                  </p>
                </div>
              </div>
            </div>

            {/* Back Link */}
            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="text-xs font-bold text-themeDark/60 hover:text-themePrimary transition-colors flex items-center justify-center gap-2 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Registration
              </Link>
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

export default EmailVerificationPage;
