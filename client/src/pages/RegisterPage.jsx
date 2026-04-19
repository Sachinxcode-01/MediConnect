import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, ShieldCheck, Mail, Lock, User, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadToast = toast.loading('Initializing profile...');
    try {
      await register(name, email, password, role);
      toast.success('Account created successfully!', { id: loadToast });
      toast.info("Welcome to the future of healthcare.");
      navigate('/'); 
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your data.';
      toast.error(msg, { id: loadToast });
    }
  };

  return (
    <div className="min-h-screen bg-themeLight text-themeDeep flex flex-row-reverse font-geist overflow-hidden relative">
      {/* Background decoration orbs */}
      <div className="absolute top-[10%] right-[-10%] w-[60vw] h-[60vw] bg-themeSoft rounded-full mix-blend-multiply filter blur-[150px] opacity-80 animate-pulse-slow"></div>
      <div className="absolute bottom-[0%] left-[-10%] w-[60vw] h-[60vw] bg-themeMedium rounded-full mix-blend-multiply filter blur-[150px] opacity-50 animate-pulse-slow"></div>

      <div className="container mx-auto flex flex-row-reverse z-10">
        {/* Right Side Info */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex w-1/2 flex-col justify-center p-20 items-end text-right"
        >
          <Link to="/" className="flex items-center gap-4 mb-20 group">
             <span className="text-3xl font-black tracking-tighter text-themeDeep italic">MediConnect</span>
             <div className="w-12 h-12 bg-themePrimary rounded-2xl flex items-center justify-center shadow-neon group-hover:-rotate-12 transition-transform">
                <ShieldCheck className="text-white w-6 h-6" />
             </div>
          </Link>
          
          <div className="space-y-8 max-w-lg">
            <h1 className="text-7xl font-black text-themeDeep leading-[1.1] tracking-tighter">
              Join the <br/>
              <span className="text-themePrimary">Healthcare Revolution.</span>
            </h1>
            <p className="text-xl text-themeDark/70 font-bold leading-relaxed">
              Become part of a decentralized, AI-enhanced medical network. Fast onboarding, secure encryption, and immediate clinician access.
            </p>
            
            <div className="flex gap-6 justify-end pt-10">
               {[
                 { label: 'Latency', val: '<50ms' },
                 { label: 'Security', val: 'AES-256' },
                 { label: 'AI Core', val: 'V4.2' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/50 shadow-glass">
                    <p className="text-[10px] font-black text-themePrimary uppercase tracking-widest">{stat.label}</p>
                    <p className="text-lg font-black text-themeDeep">{stat.val}</p>
                 </div>
               ))}
            </div>
          </div>
        </motion.div>

        {/* Left Side Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-lg bg-white/80 backdrop-blur-2xl border border-white p-10 rounded-[3.5rem] shadow-3d relative overflow-hidden group"
          >
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-black text-themeDeep tracking-tighter italic">Create Identity</h2>
              <p className="text-sm font-black text-themeDark/40 uppercase tracking-[0.2em] mt-2">Initialize secure patient or provider profile</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-themeDeep uppercase tracking-widest ml-1">Legal Name</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-themeDark/40 group-focus-within/input:text-themePrimary transition-colors">
                      <User size={18} />
                    </div>
                    <input type="text" required placeholder="John Doe" value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-themeLight/50 border-2 border-themeMedium/30 rounded-2xl pl-12 pr-4 py-3.5 text-themeDeep font-bold focus:outline-none focus:border-themePrimary focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-themeDeep uppercase tracking-widest ml-1">Email Node</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-themeDark/40 group-focus-within/input:text-themePrimary transition-colors">
                      <Mail size={18} />
                    </div>
                    <input type="email" required placeholder="vital@node.ai" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full bg-themeLight/50 border-2 border-themeMedium/30 rounded-2xl pl-12 pr-4 py-3.5 text-themeDeep font-bold focus:outline-none focus:border-themePrimary focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-themeDeep uppercase tracking-widest ml-1">Security Cipher</label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-themeDark/40 group-focus-within/input:text-themePrimary transition-colors">
                    <Lock size={18} />
                  </div>
                  <input type="password" required placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-themeLight/50 border-2 border-themeMedium/30 rounded-2xl pl-12 pr-4 py-3.5 text-themeDeep font-bold focus:outline-none focus:border-themePrimary focus:bg-white transition-all shadow-inner" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black text-themeDeep uppercase tracking-widest ml-1 flex justify-between">
                  Identity Role <Sparkles size={12} className="text-themePrimary animate-pulse" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setRole('patient')} 
                    className={`py-4 rounded-2xl border-2 font-black transition-all duration-300 shadow-sm flex flex-col items-center gap-1 ${role === 'patient' ? 'bg-themeSoft/50 text-themePrimary border-themePrimary shadow-neon' : 'bg-transparent text-gray-400 border-themeMedium/20 hover:border-themeMedium'}`}>
                    <User size={20} />
                    <span className="text-[10px] uppercase tracking-tighter">Patient Hub</span>
                  </button>
                  <button type="button" onClick={() => setRole('doctor')} 
                    className={`py-4 rounded-2xl border-2 font-black transition-all duration-300 shadow-sm flex flex-col items-center gap-1 ${role === 'doctor' ? 'bg-themeSoft/50 text-themePrimary border-themePrimary shadow-neon' : 'bg-transparent text-gray-400 border-themeMedium/20 hover:border-themeMedium'}`}>
                    <UserCheck size={20} />
                    <span className="text-[10px] uppercase tracking-tighter">Provider Portal</span>
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-themeDeep text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-3d hover:-translate-y-1 hover:shadow-neon transition-all hover:bg-themePrimary group relative overflow-hidden mt-6">
                 <span className="relative z-10 flex items-center gap-2">
                   INITIALIZE ACCOUNT <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                 </span>
                 <div className="absolute inset-0 bg-gradient-to-r from-themePrimary to-themeDeep opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm font-bold text-themeDark/60">
                Already part of the network? <Link to="/login" className="text-themePrimary font-black hover:underline uppercase tracking-widest text-[10px]">Verify Identity</Link>
              </p>
            </div>
            
            {/* Decoration */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-themeSoft rounded-full blur-[80px] translate-y-1/2 translate-x-1/2"></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
