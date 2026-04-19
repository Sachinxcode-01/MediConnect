import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Mail, Lock, ArrowRight, Shield, Globe, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadToast = toast.loading('Authenticating identity...');
    try {
      await login(email, password);
      toast.success('Access granted', { id: loadToast });
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Invalid credentials or server unreachable';
      toast.error(msg, { id: loadToast });
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'patient') navigate('/patient');
      else if (user.role === 'doctor') navigate('/doctor');
      else if (user.role === 'admin') navigate('/admin');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-themeLight text-themeDeep flex font-geist overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-themeSoft rounded-full mix-blend-multiply filter blur-[150px] opacity-70 animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-themeMedium rounded-full mix-blend-multiply filter blur-[150px] opacity-50 animate-pulse-slow"></div>

      <div className="container mx-auto flex z-10">
        {/* Left Side: Branding & Info */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex w-1/2 flex-col justify-center p-20"
        >
          <Link to="/" className="flex items-center gap-4 mb-20 group">
             <div className="w-12 h-12 bg-themePrimary rounded-2xl flex items-center justify-center shadow-neon group-hover:rotate-12 transition-transform">
                <Activity className="text-white w-6 h-6" />
             </div>
             <span className="text-3xl font-black tracking-tighter text-themeDeep italic">MediConnect</span>
          </Link>
          
          <div className="space-y-8">
            <h1 className="text-7xl font-black text-themeDeep leading-[1.1] tracking-tighter">
              Precision Health. <br/>
              <span className="text-themePrimary">Zero Friction.</span>
            </h1>
            <p className="text-xl text-themeDark/70 font-bold max-w-md leading-relaxed">
              Login to access your HIPAA-compliant dashboard, live telemetry, and AI-driven triage systems.
            </p>
            
            <div className="flex gap-4 pt-10">
              <div className="flex -space-x-4">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-themeMedium shadow-glass overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                   </div>
                 ))}
              </div>
              <div className="flex flex-col justify-center">
                 <p className="text-xs font-black text-themePrimary uppercase tracking-widest">Trusted by</p>
                 <p className="text-sm font-bold text-themeDeep">12,000+ medical professionals</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white p-12 rounded-[3.5rem] shadow-3d relative overflow-hidden group"
          >
            {/* Top link for mobile */}
            <div className="lg:hidden flex justify-center mb-10">
              <Link to="/" className="flex items-center gap-3">
                 <Activity className="text-themePrimary w-8 h-8" />
                 <span className="text-2xl font-black text-themeDeep">MediConnect</span>
              </Link>
            </div>

            <div className="mb-10 text-center">
              <h2 className="text-4xl font-black text-themeDeep tracking-tighter italic">Welcome Back</h2>
              <p className="text-sm font-black text-themeDark/40 uppercase tracking-[0.2em] mt-2">Administrative Console Access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-themeDeep uppercase tracking-widest ml-1">Email Protocol</label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-themeDark/40 group-focus-within/input:text-themePrimary transition-colors">
                    <Mail size={20} />
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-themeLight/50 border-2 border-themeMedium/30 rounded-2xl pl-12 pr-4 py-4 text-themeDeep font-bold placeholder-themeDark/30 focus:outline-none focus:border-themePrimary focus:bg-white transition-all shadow-inner" 
                    placeholder="name@medical.gov"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-themeDeep uppercase tracking-widest">Secret Key</label>
                  <button type="button" className="text-[10px] font-black text-themePrimary hover:underline uppercase tracking-wide">Forgot Pass?</button>
                </div>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-themeDark/40 group-focus-within/input:text-themePrimary transition-colors">
                    <Lock size={20} />
                  </div>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-themeLight/50 border-2 border-themeMedium/30 rounded-2xl pl-12 pr-4 py-4 text-themeDeep font-bold placeholder-themeDark/30 focus:outline-none focus:border-themePrimary focus:bg-white transition-all shadow-inner" 
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-5 bg-themeDeep text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-3d hover:-translate-y-1 hover:shadow-neon transition-all hover:bg-themePrimary group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  AUTHENTICATE <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-themePrimary to-themeDeep opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </form>

            <div className="mt-10">
              <div className="relative flex items-center justify-center mb-8">
                 <div className="absolute inset-0 border-t border-themeMedium/30"></div>
                 <span className="relative z-10 px-4 bg-white text-[10px] font-black text-themeDark/40 uppercase tracking-widest">Zero-Knowledge Auth</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                 {[Shield, Globe, MessageSquare].map((Icon, i) => (
                   <button key={i} className="py-3 border-2 border-themeMedium/20 rounded-xl flex justify-center items-center hover:bg-themeSoft hover:border-themePrimary/30 transition-all text-themeDeep shadow-sm">
                      <Icon size={20} />
                   </button>
                 ))}
              </div>
            </div>

            <div className="mt-10 text-center">
              <p className="text-sm font-bold text-themeDark/60">
                New identity? <Link to="/register" className="text-themePrimary font-black hover:underline uppercase tracking-widest text-[10px]">Initialize Account</Link>
              </p>
            </div>
            
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-themeSoft rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-themeMedium/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
