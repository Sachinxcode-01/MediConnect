import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, ShieldCheck, HeartPulse, Video, FileText, Database, Map, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const getDashboardLink = () => {
    if (!user) return '/register';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'doctor') return '/doctor';
    return '/patient';
  };

  return (
    <div className="min-h-screen bg-themeLight text-themeDeep font-geist overflow-hidden relative selection:bg-themePrimary selection:text-white">
      {/* Scrollable Container */}
      <div className="h-screen overflow-y-auto scroll-smooth custom-scrollbar relative z-10 pb-20">
        
        {/* Dynamic Background Blurs */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-themeSoft rounded-full mix-blend-multiply filter blur-[150px] opacity-80 animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-themeMedium rounded-full mix-blend-multiply filter blur-[150px] opacity-40 animate-pulse-slow"></div>
        </div>

        {/* Nav */}
        <motion.nav 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="relative z-20 flex justify-between items-center p-6 lg:px-12 backdrop-blur-md bg-white/40 border-b border-themeMedium/30 shadow-sm sticky top-0"
        >
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Activity className="text-themePrimary w-8 h-8" />
            <span className="text-2xl font-black tracking-tighter text-themeDeep">MediConnect</span>
          </Link>
          <div className="flex gap-4">
            {!user ? (
              <>
                <Link to="/login" className="px-6 py-2 rounded-full font-bold text-themeDark bg-white hover:bg-themeSoft border border-themeMedium/50 shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all">Log In</Link>
                <Link to="/register" className="px-6 py-2 bg-themePrimary text-white font-bold rounded-full shadow-neon hover:shadow-neon-hover transform hover:-translate-y-1 transition-all duration-300 border border-themePrimary">Sign Up</Link>
              </>
            ) : (
              <Link to={getDashboardLink()} className="px-6 py-2 bg-themePrimary text-white font-bold rounded-full shadow-neon hover:shadow-neon-hover transform hover:-translate-y-1 transition-all duration-300">My Dashboard</Link>
            )}
          </div>
        </motion.nav>

        {/* Hero Section */}
        <motion.main 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-center justify-center pt-32 pb-24 px-4 text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-themePrimary/30 mb-8 shadow-3d transform hover:-translate-y-1 transition duration-500 animate-float">
            <span className="w-2.5 h-2.5 rounded-full bg-themePrimary animate-pulse"></span>
            <span className="text-sm font-black text-themeDark">AI-Powered Healthcare Triage is Live</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 max-w-5xl leading-tight tracking-tight text-themeDeep drop-shadow-2xl">
            Modern Telemedicine, <br/>
            <span className="text-themePrimary italic">Instantly Accessible.</span>
          </h1>
          <p className="text-xl text-themeDark mb-12 max-w-2xl leading-relaxed font-bold opacity-80">
            Break the barriers to healthcare. Connect with doctors instantly, track your vitals via wearables, and let your AI health assistant process your symptoms continuously.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            <Link to={getDashboardLink()} className="px-10 py-5 bg-themePrimary text-white font-black text-xl rounded-2xl shadow-neon hover:shadow-neon-hover transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 border-b-8 border-themeDeep/30 active:border-b-0 active:translate-y-0">
              {user ? 'Go to Dashboard' : 'Get Started (Patient)'}
            </Link>
            {!user && (
              <Link to="/login" className="px-10 py-5 bg-white border-4 border-themePrimary/20 text-themeDark font-black text-xl rounded-2xl hover:bg-themeSoft hover:border-themePrimary shadow-3d hover:shadow-neon transform hover:-translate-y-2 transition-all duration-300">
                Sign In
              </Link>
            )}
          </div>
        </motion.main>

        {/* Features Grid */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
             <h2 className="text-5xl font-black text-themeDeep mb-4 tracking-tighter italic">Future of Health Control</h2>
             <p className="text-themeDark font-black uppercase tracking-widest text-xs opacity-60">Integrated seamlessly into a single encrypted dashboard.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Activity, title: 'AI Symptom Checker', text: "OpenRouter integrations intelligently route your symptoms to elite medical models like LLaMA 3 or Claude 3.5 Sonnet." },
              { icon: HeartPulse, title: 'Real-time Wearables', text: "Live streaming WebSocket API integrations monitor your SpO2 and Heart rate. Alert doctors automatically on critical pulses." },
              { icon: Video, title: 'Secured WebRTC Video', text: "Native HTML5 WebRTC supports massive zero-latency peer-to-peer clinical consultation video channels." },
              { icon: Database, title: 'Immutable Records', text: "Your prescriptions, lab results, and visit summaries are securely hosted on a private Supabase PostgreSQL ledger." },
              { icon: ShieldCheck, title: 'Role-Based Access', text: "Doctors, Patients, and Admins are strictly scoped using AES-256 JWT Authorization to guarantee PII protection." },
              { icon: Sparkles, title: 'Daily AI Report', text: "Holistic Vitality scores generated every 24 hours based on your historic wearable telemetry and triage data." },
            ].map((feature, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/90 border border-themeMedium/40 p-10 rounded-[2.5rem] shadow-glass hover-3d transition-all duration-500 group relative overflow-hidden"
              >
                <div className="w-20 h-20 rounded-3xl bg-themeSoft flex items-center justify-center mb-6 border border-themeMedium/50 group-hover:bg-themePrimary group-hover:shadow-neon transition-all duration-500 relative z-10">
                  <feature.icon className="w-10 h-10 text-themePrimary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-themeDeep group-hover:text-themePrimary transition-colors relative z-10">{feature.title}</h3>
                <p className="text-themeDark leading-relaxed font-bold opacity-70 relative z-10">{feature.text}</p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-themeSoft rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it Works Section */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 mt-24 mb-24 bg-white/40 backdrop-blur-xl rounded-[4rem] shadow-3d border border-themeMedium/30 glass">
           <motion.div 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             className="text-center mb-20 max-w-3xl mx-auto"
           >
               <h2 className="text-4xl md:text-6xl font-black text-themeDeep mb-6 tracking-tighter italic underline decoration-themePrimary decoration-8 underline-offset-8">A New Standard</h2>
               <p className="text-xl text-themeDark font-black uppercase tracking-widest text-xs opacity-60">Frictionless Lifecycle Security</p>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
              {/* Steps */}
              <div className="space-y-12 md:pl-12">
                 {[
                   { id: '01', title: 'Input Symptoms', text: 'MediConnect pings OpenRouter to evaluate your pain severity securely and logs it into the secure triage database.' },
                   { id: '02', title: 'Connect Wearables', text: 'Smart watches sync to our WebSockets engine. If vitals drop, automated flags alert any reviewing doctor.' },
                   { id: '03', title: 'Start Consultation', text: 'Launch a P2P video call. Your browser links audio/video natively securely bypassing third-party servers.' },
                   { id: '04', title: 'Manage Records', text: 'Access prescriptions and summaries via the portal. Map nearby Pharmacies or download encrypted PDFs.' }
                 ].map((step, idx) => (
                   <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    className="flex items-start gap-6 group cursor-default"
                   >
                      <div className="flex-shrink-0 w-16 h-16 rounded-3xl bg-themeDeep text-themePrimary font-black text-2xl flex items-center justify-center shadow-3d group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                        {step.id}
                      </div>
                      <div>
                        <h4 className="text-3xl font-black text-themeDeep mb-2 group-hover:text-themePrimary transition-colors">{step.title}</h4>
                        <p className="text-themeDark font-bold opacity-70 leading-relaxed text-lg">{step.text}</p>
                      </div>
                   </motion.div>
                 ))}
              </div>

              {/* Visualizer Block */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true }}
                className="bg-white/50 border border-themeMedium/30 p-12 rounded-[3.5rem] min-h-[600px] flex items-center justify-center relative overflow-visible group shadow-3d"
              >
                 <div className="absolute inset-0 bg-gradient-to-tr from-themePrimary/5 to-transparent rounded-[3.5rem]"></div>
                 <div className="relative z-10 w-full max-w-sm space-y-8">
                    {/* Mock Chat / Triage */}
                    <div className="bg-white p-6 rounded-3xl shadow-3d border border-themePrimary/20 transform group-hover:-translate-y-4 group-hover:-rotate-3 transition-all duration-700 hover-3d">
                       <div className="flex items-center gap-3 mb-4">
                          <Activity className="text-themePrimary w-6 h-6"/>
                          <span className="font-black text-sm text-themeDeep uppercase tracking-widest">AI Triage Status</span>
                       </div>
                       <div className="h-2.5 bg-themeLight rounded-full overflow-hidden">
                          <div className="w-3/4 h-full bg-themePrimary animate-pulse"></div>
                       </div>
                    </div>

                    {/* Mock Wearable */}
                    <div className="bg-white p-6 rounded-3xl shadow-3d border border-themeMedium/30 transform group-hover:translate-x-6 group-hover:rotate-3 transition-all duration-700 hover-3d">
                       <div className="flex items-center gap-3 mb-4">
                          <HeartPulse className="text-red-500 w-6 h-6"/>
                          <span className="font-black text-sm text-themeDeep uppercase tracking-widest">SpO2 Level</span>
                       </div>
                       <span className="text-4xl font-black text-themeDeep">99<span className="text-xl opacity-40">%</span></span>
                    </div>

                    {/* Mock Video Request */}
                    <div className="bg-themeDeep p-6 rounded-3xl shadow-neon border border-themePrimary/40 transform group-hover:-translate-y-4 group-hover:scale-110 transition-all duration-700 hover-3d">
                       <div className="flex items-center gap-3 text-white mb-4">
                          <Video className="text-themePrimary w-6 h-6"/>
                          <span className="font-bold text-sm">Dr. House is calling...</span>
                       </div>
                       <div className="flex gap-3">
                          <div className="flex-1 py-3 bg-themePrimary rounded-2xl text-xs font-black text-white text-center shadow-neon">ACCEPT</div>
                          <div className="w-12 h-12 bg-red-500/20 py-3 rounded-2xl text-xs font-black text-red-500 text-center flex items-center justify-center">X</div>
                       </div>
                    </div>
                 </div>
              </motion.div>
           </div>
        </section>
      </div>

      {/* Persistent Decorative blobs */}
      <div className="fixed top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-themeSoft/20 rounded-full blur-[200px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-themeMedium/10 rounded-full blur-[200px] pointer-events-none"></div>
    </div>
  );
};

export default LandingPage;

