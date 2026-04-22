import React, { useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, ShieldCheck, HeartPulse, Video, FileText, Database, Map, Sparkles, ArrowRight, CheckCircle, Zap, Lock, Users, TrendingUp } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const getDashboardLink = () => {
    if (!user) return '/register';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'doctor') return '/doctor';
    return '/patient';
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5 }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-themeLight via-white to-themeSoft text-themeDeep font-geist overflow-hidden relative selection:bg-themePrimary selection:text-white">
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-themePrimary via-themeDark to-themePrimary z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Animated Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-themeSoft/60 to-themePrimary/20 rounded-full filter blur-[120px] opacity-70"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-gradient-to-tl from-themeMedium/40 to-themePrimary/10 rounded-full filter blur-[150px] opacity-50"
        />
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -80, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] left-[60%] w-[40vw] h-[40vw] bg-gradient-to-br from-white/40 to-themeSoft/30 rounded-full filter blur-[100px] opacity-40"
        />
      </div>

      {/* Scrollable Container */}
      <div className="relative z-10 pb-20">

        {/* Premium Navigation */}
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-white/40 shadow-lg shadow-themePrimary/5"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-gradient-to-br from-themePrimary to-themeDark rounded-xl flex items-center justify-center shadow-neon group-hover:shadow-neon-hover"
              >
                <Activity className="text-white w-5 h-5" />
              </motion.div>
              <span className="text-2xl font-black tracking-tighter text-themeDeep group-hover:text-themePrimary transition-colors">MediConnect</span>
            </Link>
            <div className="flex items-center gap-3">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:flex px-5 py-2.5 rounded-full font-bold text-sm text-themeDark bg-white/80 hover:bg-white border border-themeMedium/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-gradient-to-r from-themePrimary to-themeDark text-white font-bold text-sm rounded-full shadow-neon hover:shadow-neon-hover transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                  >
                    Get Started
                    <ArrowRight size={16} />
                  </Link>
                </>
              ) : (
                <Link
                  to={getDashboardLink()}
                  className="px-5 py-2.5 bg-gradient-to-r from-themePrimary to-themeDark text-white font-bold text-sm rounded-full shadow-neon hover:shadow-neon-hover transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                >
                  <Users size={16} />
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <motion.main
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative pt-20 pb-32 px-4"
        >
          <div className="max-w-7xl mx-auto">
            {/* Hero Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex justify-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-themePrimary/30 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group cursor-default">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-themePrimary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-themePrimary"></span>
                </span>
                <span className="text-sm font-black text-themeDark group-hover:text-themePrimary transition-colors">AI-Powered Healthcare Triage is Live</span>
                <Sparkles className="w-4 h-4 text-themePrimary animate-pulse" />
              </div>
            </motion.div>

            {/* Hero Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 max-w-6xl mx-auto leading-[1.1] tracking-tight text-center"
            >
              <span className="text-themeDeep">Modern Telemedicine,</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-themePrimary via-themeDark to-themePrimary animate-gradient bg-300% italic">
                Instantly Accessible.
              </span>
            </motion.h1>

            {/* Hero Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-lg sm:text-xl text-themeDark/80 mb-12 max-w-2xl mx-auto leading-relaxed font-medium text-center"
            >
              Break the barriers to healthcare. Connect with doctors instantly, track your vitals via wearables, and let your AI health assistant process your symptoms continuously.
            </motion.p>

            {/* Hero CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Link
                to={getDashboardLink()}
                className="group px-8 py-4 bg-gradient-to-r from-themePrimary to-themeDark text-white font-black text-lg rounded-2xl shadow-neon hover:shadow-neon-hover transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden relative"
              >
                <span className="relative z-10">{user ? 'Go to Dashboard' : 'Get Started Free'}</span>
                <ArrowRight className="relative z-10 group-hover:translate-x-2 transition-transform" size={20} />
                <div className="absolute inset-0 bg-gradient-to-r from-themeDark to-themePrimary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="group px-8 py-4 bg-white/80 backdrop-blur-md border-2 border-themePrimary/30 text-themeDark font-black text-lg rounded-2xl hover:bg-white hover:border-themePrimary hover:shadow-neon transform hover:-translate-y-2 transition-all duration-300 flex items-center gap-2"
                >
                  Sign In
                </Link>
              )}
            </motion.div>

            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {[
                { value: '50K+', label: 'Active Patients', icon: Users },
                { value: '<50ms', label: 'Response Time', icon: Zap },
                { value: '99.9%', label: 'Uptime SLA', icon: ShieldCheck },
                { value: '24/7', label: 'AI Monitoring', icon: Activity },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + idx * 0.1 }}
                  className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-glass text-center group hover:-translate-y-2 hover:shadow-neon transition-all duration-300"
                >
                  <stat.icon className="w-6 h-6 text-themePrimary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-3xl font-black text-themeDeep mb-1">{stat.value}</p>
                  <p className="text-xs font-black text-themeDark/60 uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.main>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative py-24 px-4"
        >
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-themeSoft/50 rounded-full mb-6 border border-themePrimary/20">
                <Zap className="w-4 h-4 text-themePrimary" />
                <span className="text-xs font-black text-themePrimary uppercase tracking-widest">Powerful Features</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-themeDeep mb-6 tracking-tighter italic">
                Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-themePrimary to-themeDark">Health Control</span>
              </h2>
              <p className="text-lg text-themeDark/70 max-w-2xl mx-auto font-medium">
                Integrated seamlessly into a single encrypted dashboard.
              </p>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                { icon: Activity, title: 'AI Symptom Checker', text: "OpenRouter integrations intelligently route your symptoms to elite medical models like LLaMA 3 or Claude 3.5 Sonnet.", gradient: 'from-green-400 to-emerald-600' },
                { icon: HeartPulse, title: 'Real-time Wearables', text: "Live streaming WebSocket API integrations monitor your SpO2 and Heart rate. Alert doctors automatically on critical pulses.", gradient: 'from-red-400 to-rose-600' },
                { icon: Video, title: 'Secured WebRTC Video', text: "Native HTML5 WebRTC supports massive zero-latency peer-to-peer clinical consultation video channels.", gradient: 'from-blue-400 to-indigo-600' },
                { icon: Database, title: 'Immutable Records', text: "Your prescriptions, lab results, and visit summaries are securely hosted on a private Supabase PostgreSQL ledger.", gradient: 'from-purple-400 to-violet-600' },
                { icon: ShieldCheck, title: 'Role-Based Access', text: "Doctors, Patients, and Admins are strictly scoped using AES-256 JWT Authorization to guarantee PII protection.", gradient: 'from-amber-400 to-orange-600' },
                { icon: Sparkles, title: 'Daily AI Report', text: "Holistic Vitality scores generated every 24 hours based on your historic wearable telemetry and triage data.", gradient: 'from-pink-400 to-rose-600' },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  className="group relative bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-glass hover:shadow-premium transition-all duration-500 overflow-hidden hover:-translate-y-2"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

                  {/* Icon */}
                  <div className="relative z-10 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-themeSoft to-themePrimary/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-themePrimary/20">
                      <feature.icon className="w-8 h-8 text-themePrimary" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="relative z-10 text-xl font-black text-themeDeep mb-3 group-hover:text-themePrimary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="relative z-10 text-themeDark/70 leading-relaxed font-medium">
                    {feature.text}
                  </p>

                  {/* Decorative Elements */}
                  <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-themeSoft to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="relative py-24 px-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-white/80 to-themeSoft/30 backdrop-blur-xl p-8 sm:p-12 lg:p-16 rounded-[3rem] shadow-premium border border-white/50">
              {/* Section Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-themeDeep/5 rounded-full mb-6 border border-themePrimary/20">
                  <TrendingUp className="w-4 h-4 text-themePrimary" />
                  <span className="text-xs font-black text-themePrimary uppercase tracking-widest">How It Works</span>
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-themeDeep mb-4 tracking-tighter italic">
                  A New <span className="text-transparent bg-clip-text bg-gradient-to-r from-themePrimary to-themeDark">Standard</span>
                </h2>
                <p className="text-sm text-themeDark/60 font-black uppercase tracking-widest">
                  Frictionless Lifecycle Security
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Steps */}
                <div className="space-y-8">
                  {[
                    { id: '01', title: 'Input Symptoms', text: 'MediConnect pings OpenRouter to evaluate your pain severity securely and logs it into the secure triage database.', icon: Activity },
                    { id: '02', title: 'Connect Wearables', text: 'Smart watches sync to our WebSockets engine. If vitals drop, automated flags alert any reviewing doctor.', icon: HeartPulse },
                    { id: '03', title: 'Start Consultation', text: 'Launch a P2P video call. Your browser links audio/video natively securely bypassing third-party servers.', icon: Video },
                    { id: '04', title: 'Manage Records', text: 'Access prescriptions and summaries via the portal. Map nearby Pharmacies or download encrypted PDFs.', icon: FileText }
                  ].map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="flex items-start gap-6 group p-4 rounded-2xl hover:bg-white/50 transition-all duration-300"
                    >
                      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-themePrimary to-themeDark text-white font-black text-xl flex items-center justify-center shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                        {step.id}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <step.icon className="w-5 h-5 text-themePrimary" />
                          <h4 className="text-2xl font-black text-themeDeep group-hover:text-themePrimary transition-colors">{step.title}</h4>
                        </div>
                        <p className="text-themeDark/70 font-medium leading-relaxed">{step.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Visualizer Block */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                  whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  <div className="bg-white/60 backdrop-blur-md p-8 rounded-[3rem] border border-white/50 shadow-3d">
                    <div className="space-y-6">
                      {/* Mock Chat / Triage */}
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="bg-white p-5 rounded-2xl shadow-lg border border-themePrimary/20"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-themeSoft flex items-center justify-center">
                            <Activity className="text-themePrimary w-4 h-4" />
                          </div>
                          <span className="font-black text-xs text-themeDeep uppercase tracking-widest">AI Triage Status</span>
                        </div>
                        <div className="h-2 bg-themeLight rounded-full overflow-hidden">
                          <motion.div
                            animate={{ width: ['70%', '75%', '70%'] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-full bg-gradient-to-r from-themePrimary to-themeDark"
                          ></motion.div>
                        </div>
                      </motion.div>

                      {/* Mock Wearable */}
                      <motion.div
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="bg-white p-5 rounded-2xl shadow-lg border border-themeMedium/30"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <HeartPulse className="text-red-500 w-4 h-4" />
                          </div>
                          <span className="font-black text-xs text-themeDeep uppercase tracking-widest">SpO2 Level</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-themeDeep">99</span>
                          <span className="text-lg font-bold text-themeDark/40">%</span>
                        </div>
                      </motion.div>

                      {/* Mock Video Request */}
                      <motion.div
                        animate={{ scale: [1, 1.02, 1], y: [0, -3, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="bg-gradient-to-br from-themeDeep to-themePrimary p-5 rounded-2xl shadow-neon border border-themePrimary/40"
                      >
                        <div className="flex items-center gap-3 text-white mb-4">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <Video className="text-white w-4 h-4" />
                          </div>
                          <span className="font-bold text-sm">Dr. House is calling...</span>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1 py-2.5 bg-themePrimary rounded-xl text-xs font-black text-white text-center shadow-neon hover:bg-white/20 transition-colors cursor-pointer">
                            ACCEPT
                          </div>
                          <div className="w-10 h-10 bg-red-500/30 rounded-xl text-xs font-black text-red-200 text-center flex items-center justify-center hover:bg-red-500/50 transition-colors cursor-pointer">
                            ✕
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-themePrimary/30 to-transparent rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-themeSoft/40 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Trust Badges Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-4 border-t border-themeMedium/20"
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-black text-themeDark/50 uppercase tracking-widest mb-8">
            Trusted by Healthcare Professionals Worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {[
              { label: 'HIPAA Compliant', icon: ShieldCheck },
              { label: 'End-to-End Encrypted', icon: Lock },
              { label: '50,000+ Patients', icon: Users },
              { label: '500+ Hospitals', icon: Database },
            ].map((badge, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 px-6 py-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm"
              >
                <badge.icon className="w-6 h-6 text-themePrimary" />
                <span className="font-black text-themeDeep text-sm">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 px-4"
      >
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-themePrimary via-themeDark to-themePrimary p-12 sm:p-16 rounded-[3rem] shadow-premium overflow-hidden text-center">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px]"></div>
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">
                  Ready to Transform Your Healthcare Experience?
                </h2>
                <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto font-medium">
                  Join thousands of patients and doctors who trust MediConnect for secure, instant, and AI-powered medical care.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    className="group px-8 py-4 bg-white text-themeDeep font-black text-lg rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Start Free Trial
                    <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 bg-transparent text-white font-black text-lg rounded-2xl border-2 border-white/50 hover:bg-white/10 hover:border-white transition-all duration-300"
                  >
                    Existing User? Login
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Decorative Circles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -top-32 -right-32 w-64 h-64 rounded-full border-4 border-white/10"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full border-4 border-white/10"
            />
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-themeMedium/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-themePrimary to-themeDark rounded-xl flex items-center justify-center shadow-neon">
                <Activity className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-themeDeep">MediConnect</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-themeDark/60">
              <a href="#" className="hover:text-themePrimary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-themePrimary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-themePrimary transition-colors">Contact Support</a>
              <a href="#" className="hover:text-themePrimary transition-colors">Security</a>
            </div>
            <p className="text-xs font-medium text-themeDark/40">
              © {new Date().getFullYear()} MediConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

