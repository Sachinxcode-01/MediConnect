import React, { useContext, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Activity, ShieldCheck, HeartPulse, Video, FileText, Database, Map, Sparkles, 
  ArrowRight, CheckCircle, Zap, Lock, Users, TrendingUp, ChevronDown, 
  Clock, Stethoscope, AlertTriangle, Shield, CheckCircle2, HelpCircle, 
  Layers, UserCheck, MessageSquare, Compass, PhoneCall
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

import AnimatedButton from '../components/ui/AnimatedButton';
import AnimatedCard from '../components/ui/AnimatedCard';
import AnimatedText from '../components/ui/AnimatedText';
import ScrollReveal from '../components/ui/ScrollReveal';
import { StaggerContainer, StaggerItem } from '../components/ui/StaggerContainer';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Navigation link helper
  const getDashboardLink = () => {
    if (!user) return '/register';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'doctor') return '/doctor';
    return '/patient';
  };

  // Interactive AI Demo State
  const [demoSymptoms, setDemoSymptoms] = useState(['Headache', 'Fever']);
  const [demoDuration, setDemoDuration] = useState('2 days');
  const [demoStep, setDemoStep] = useState('input'); // 'input' | 'analyzing' | 'result'

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Hero Section GSAP Timeline
  const heroRef = useRef(null);
  useGSAP(() => {
    if (!heroRef.current) return;
    const tl = gsap.timeline();

    tl.from('.hero-eyebrow', { opacity: 0, y: 15, duration: 0.5, ease: 'power2.out' })
      .from('.hero-headline', { opacity: 0, y: 25, duration: 0.7, ease: 'power3.out' }, '-=0.3')
      .from('.hero-desc', { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' }, '-=0.4')
      .from('.hero-cta', { opacity: 0, y: 15, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .from('.hero-disclaimer', { opacity: 0, duration: 0.4 }, '-=0.2')
      .from('.hero-visual', { opacity: 0, scale: 0.96, duration: 0.8, ease: 'power3.out' }, '-=0.4');
  }, { scope: heroRef });

  const runDemoAnalysis = () => {
    setDemoStep('analyzing');
    setTimeout(() => {
      setDemoStep('result');
    }, 1500);
  };

  // Sample Vitals Demo Data
  const sampleVitals = [
    { time: '08:00', hr: 72, spo2: 99 },
    { time: '10:00', hr: 75, spo2: 98 },
    { time: '12:00', hr: 82, spo2: 99 },
    { time: '14:00', hr: 78, spo2: 99 },
    { time: '16:00', hr: 74, spo2: 98 },
    { time: '18:00', hr: 71, spo2: 99 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-geist overflow-x-hidden selection:bg-emerald-500 selection:text-white">

      {/* 1. STICKY NAVBAR */}
      <motion.nav 
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="text-slate-950 w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">MediConnect</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#patients" className="hover:text-emerald-400 transition-colors">For Patients</a>
            <a href="#doctors" className="hover:text-emerald-400 transition-colors">For Doctors</a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#security" className="hover:text-emerald-400 transition-colors">Security</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login">
                  <AnimatedButton variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                    Log In
                  </AnimatedButton>
                </Link>
                <Link to="/register">
                  <AnimatedButton variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                    Get Started
                  </AnimatedButton>
                </Link>
              </>
            ) : (
              <Link to={getDashboardLink()}>
                <AnimatedButton variant="primary" size="sm" icon={Users}>
                  Dashboard
                </AnimatedButton>
              </Link>
            )}
          </div>
        </div>
      </motion.nav>

      {/* 2. HERO SECTION */}
      <section ref={heroRef} className="relative pt-16 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <div className="hero-eyebrow inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
            <Sparkles size={14} className="animate-pulse" />
            Connected AI-Assisted Telehealth Platform
          </div>

          <h1 className="hero-headline text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white max-w-5xl mx-auto">
            Healthcare,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 italic">
              connected around you.
            </span>
          </h1>

          <p className="hero-desc text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            AI-assisted triage guidance. Verified doctors. Real-time video consultations. Immutable medical records. One connected healthcare experience.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to={getDashboardLink()}>
              <AnimatedButton variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                {user ? 'Go to Workspace' : 'Get Started'}
              </AnimatedButton>
            </Link>
            <a href="#how-it-works">
              <AnimatedButton variant="secondary" size="lg">
                See How It Works
              </AnimatedButton>
            </a>
          </div>

          <p className="hero-disclaimer text-[11px] font-bold text-slate-400 max-w-lg mx-auto uppercase tracking-wider">
            Disclaimer: MediConnect provides AI-assisted healthcare information for decision support. It does not replace professional medical diagnosis or emergency care.
          </p>

          {/* Hero Visual Composition */}
          <div className="hero-visual pt-8">
            <div className="p-4 bg-slate-900/90 rounded-[2.5rem] border border-slate-800 shadow-2xl max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase">
                  <Sparkles size={16} /> AI Triage Signal
                </div>
                <p className="text-sm font-bold text-white">Symptoms: Sharp chest discomfort, dyspnea</p>
                <div className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full text-[10px] font-black uppercase tracking-wider w-fit">
                  Critical Priority • Escalated
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase">
                  <UserCheck size={16} /> Verified Clinician
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
                    DR
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Dr. Maya Rao, MD</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Cardiology Specialist</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase">
                  <HeartPulse size={16} /> Live Vitals Stream
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">74</span>
                  <span className="text-xs font-bold text-slate-400">BPM</span>
                  <span className="ml-auto text-emerald-400 text-xs font-bold">99% SpO₂</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST & VALUE STRIP */}
      <section className="py-10 border-y border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'AI-Assisted Triage', icon: Sparkles },
              { label: 'Verified Doctors', icon: Stethoscope },
              { label: 'Secure Medical Records', icon: Database },
              { label: 'Real-Time Vitals', icon: HeartPulse }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-3 text-slate-300">
                <item.icon className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHAT IS MEDICONNECT? */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <ScrollReveal className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Platform Vision</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              One connected place for your complete healthcare journey.
            </h2>
            <p className="text-slate-400 text-base font-medium">
              MediConnect eliminates friction between symptom onset, triage assessment, doctor discovery, consultation, medical records, and continuous vital monitoring.
            </p>
          </ScrollReveal>

          {/* 7-Step Horizontal Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {[
              { step: '01', label: 'Symptoms', desc: 'Describe discomfort' },
              { step: '02', label: 'Triage', desc: 'AI urgency assessment' },
              { step: '03', label: 'Doctor', desc: 'Match specialist' },
              { step: '04', label: 'Consult', desc: 'P2P Telehealth call' },
              { step: '05', label: 'Prescribe', desc: 'Digital Rx issued' },
              { step: '06', label: 'Records', desc: 'Archived to EMR' },
              { step: '07', label: 'Follow-up', desc: 'Continuous telemetry' }
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.08} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-center space-y-2 hover:border-emerald-500/40 transition-all">
                <span className="text-xs font-black text-emerald-400">{item.step}</span>
                <h4 className="font-bold text-white text-sm">{item.label}</h4>
                <p className="text-[10px] font-bold text-slate-500">{item.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. THE HEALTHCARE PROBLEM */}
      <section className="py-24 px-6 bg-slate-900/30 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <ScrollReveal className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-red-400">The Problem</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Traditional healthcare is fragmented & confusing.
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Uncertainty', desc: 'Where should I start when symptoms appear unexpectedly?' },
              { title: 'Discovery', desc: 'Which doctor is appropriate for my specific medical condition?' },
              { title: 'Access', desc: 'How can I connect quickly without waiting weeks for an appointment?' },
              { title: 'Continuity', desc: 'Where are my prescriptions, lab results, and consultation records stored?' }
            ].map((prob, i) => (
              <ScrollReveal key={i} delay={i * 0.1} className="p-6 bg-slate-900 rounded-3xl border border-red-500/20 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-black flex items-center justify-center text-xs">
                  0{i+1}
                </div>
                <h4 className="font-black text-white text-lg">{prob.title}</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{prob.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW MEDICONNECT WORKS (5 STEPS) */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <ScrollReveal className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Step-by-Step Experience</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">How MediConnect Works</h2>
          </ScrollReveal>

          <div className="space-y-8 max-w-4xl mx-auto">
            {[
              { step: 'Step 1', title: 'Start Your Account', desc: 'Create an account and build your basic health profile securely.', icon: Compass },
              { step: 'Step 2', title: 'Understand Symptoms', desc: 'Use AI-assisted triage to organize symptoms and evaluate urgency signals.', icon: Sparkles },
              { step: 'Step 3', title: 'Connect With Doctors', desc: 'Explore verified doctor profiles filtered by specialty, experience, and availability.', icon: Stethoscope },
              { step: 'Step 4', title: 'Consult Online', desc: 'Book and attend an encrypted P2P video consultation.', icon: Video },
              { step: 'Step 5', title: 'Continue Care', desc: 'Access prescriptions, medical records, and continuous vitals from one unified vault.', icon: Database }
            ].map((s, i) => (
              <ScrollReveal key={i} delay={i * 0.1} className="p-8 bg-slate-900 rounded-3xl border border-slate-800 flex items-start gap-6 hover:border-emerald-500/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <s.icon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400">{s.step}</span>
                  <h3 className="text-xl font-black text-white">{s.title}</h3>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. AI-ASSISTED TRIAGE SECTION & INTERACTIVE DEMO */}
      <section className="py-24 px-6 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal className="space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Intelligent Triage Engine</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Start with your symptoms.<br />Get a clearer next step.
            </h2>
            <p className="text-slate-300 text-base font-medium leading-relaxed">
              Describe what you are experiencing. MediConnect organizes symptom signals, checks emergency red flags, and provides structured recommendations to guide your next step with a healthcare professional.
            </p>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold">
              Note: AI triage is an assistive decision-support tool. It does not provide medical diagnosis.
            </div>
          </ScrollReveal>

          {/* Interactive AI Triage Demo Widget */}
          <ScrollReveal className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <Sparkles size={16} /> Interactive Triage Demo
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Demo Preview</span>
            </div>

            {demoStep === 'input' && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-300 uppercase">Select Symptoms</label>
                <div className="flex flex-wrap gap-2">
                  {['Headache', 'Fever', 'Shortness of breath', 'Chest pain', 'Cough'].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setDemoSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        demoSymptoms.includes(s)
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {demoSymptoms.includes(s) ? '✓ ' : '+ '}{s}
                    </button>
                  ))}
                </div>

                <AnimatedButton onClick={runDemoAnalysis} variant="primary" size="md" className="w-full">
                  Run Demo Triage Analysis
                </AnimatedButton>
              </div>
            )}

            {demoStep === 'analyzing' && (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-spin text-emerald-400 mx-auto">
                  <Sparkles size={24} />
                </div>
                <p className="text-sm font-bold text-white">Analyzing symptom signals & emergency red flags...</p>
              </div>
            )}

            {demoStep === 'result' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-emerald-400">Severity</span>
                    <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase">
                      {demoSymptoms.includes('Chest pain') || demoSymptoms.includes('Shortness of breath') ? 'Critical / Immediate' : 'Medium / Routine'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {demoSymptoms.includes('Chest pain')
                      ? 'Seek immediate emergency medical care at the nearest ER.'
                      : 'Schedule a consultation with a General Practitioner or Cardiologist.'}
                  </p>
                </div>
                <AnimatedButton onClick={() => setDemoStep('input')} variant="outline" size="sm" className="w-full">
                  Reset Demo
                </AnimatedButton>
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* 8. DOCTOR DISCOVERY & APPOINTMENT SHOWCASE */}
      <section id="patients" className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <ScrollReveal className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Doctor Discovery & Telehealth</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Find care that fits your needs.</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Dr. Maya Rao', spec: 'Cardiology', exp: '12 Years Exp', fee: '$50', rating: '4.9' },
              { name: 'Dr. James Chen', spec: 'General Medicine', exp: '8 Years Exp', fee: '$40', rating: '4.8' },
              { name: 'Dr. Sarah Jenkins', spec: 'Pediatrics', exp: '15 Years Exp', fee: '$60', rating: '5.0' }
            ].map((doc, i) => (
              <AnimatedCard key={i} className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center">
                    {doc.name[4]}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-base">{doc.name}</h4>
                    <p className="text-xs font-bold text-emerald-400">{doc.spec}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs font-bold text-slate-400">
                  <div className="flex justify-between"><span>Experience:</span> <span className="text-white">{doc.exp}</span></div>
                  <div className="flex justify-between"><span>Rating:</span> <span className="text-amber-400">⭐ {doc.rating}</span></div>
                  <div className="flex justify-between"><span>Fee:</span> <span className="text-white">{doc.fee}</span></div>
                </div>
                <AnimatedButton variant="primary" size="sm" className="w-full">
                  Book Appointment
                </AnimatedButton>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* 9. LIVE VITALS & RECHARTS STREAM */}
      <section className="py-24 px-6 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <ScrollReveal className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Biometric Monitoring</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Understand your health data over time.</h2>
          </ScrollReveal>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-black text-white text-lg">Heart Rate & SpO₂ Stream</h4>
                <p className="text-xs font-bold text-slate-400">Live telemetry snapshot</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                <span className="text-xs font-black text-emerald-400 uppercase">Stream Active</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampleVitals}>
                  <defs>
                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px' }} />
                  <Area type="monotone" dataKey="hr" stroke="#10B981" fillOpacity={1} fill="url(#colorHr)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* 10. AI SAFETY & ETHICS */}
      <section id="security" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal className="space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">AI Safety & Governance</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              AI should assist care,<br />not replace clinical judgment.
            </h2>
            <p className="text-slate-300 text-base font-medium leading-relaxed">
              MediConnect enforces explicit boundaries: AI organizes symptom context and flags potential emergency signals, while licensed clinicians retain full responsibility for clinical decisions.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-emerald-950/40 border border-emerald-500/30 rounded-3xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <h4 className="font-black text-white text-lg">AI Triage Assist</h4>
              <p className="text-xs font-medium text-slate-300 leading-relaxed">Organizes symptoms, identifies urgency levels, and highlights red flags for clinician review.</p>
            </div>
            <div className="p-6 bg-red-950/40 border border-red-500/30 rounded-3xl space-y-2">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h4 className="font-black text-white text-lg">Not Autonomous Diagnosis</h4>
              <p className="text-xs font-medium text-slate-300 leading-relaxed">Does not prescribe medication or deliver final medical diagnosis without clinician approval.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FAQ ACCORDION */}
      <section id="faq" className="py-24 px-6 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto space-y-12">
          <ScrollReveal className="text-center space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Frequently Asked Questions</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Got Questions? We have answers.</h2>
          </ScrollReveal>

          <div className="space-y-4">
            {[
              { q: 'What is MediConnect?', a: 'MediConnect is an AI-assisted healthcare accessibility platform connecting patients with triage assessment, doctor discovery, video consultations, and EMR records.' },
              { q: 'How does AI triage work?', a: 'AI triage analyzes patient symptoms against emergency safety rules and clinical guidelines to recommend urgency levels (Immediate, Routine, Self Care).' },
              { q: 'Does MediConnect replace my doctor?', a: 'No. MediConnect AI is an assistive decision-support layer. Professional clinicians make all official diagnoses and prescriptions.' },
              { q: 'How do video consultations work?', a: 'Consultations run over encrypted WebRTC rooms directly between patient and doctor browsers with zero-latency video.' }
            ].map((faq, i) => (
              <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left font-black text-white text-base flex justify-between items-center"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-emerald-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-sm font-medium text-slate-400 leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FINAL CTA & FOOTER */}
      <section className="py-24 px-6 text-center space-y-8 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Your next healthcare step,<br /><span className="text-emerald-400 italic">connected.</span>
          </h2>
          <p className="text-slate-400 font-medium text-base">
            Start your MediConnect journey today for instant AI triage, doctor access, and secure medical records.
          </p>
          <div className="pt-4">
            <Link to="/register">
              <AnimatedButton variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                Start Free Trial
              </AnimatedButton>
            </Link>
          </div>
        </div>

        <footer className="pt-16 border-t border-slate-800/80 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500 font-bold">
          <div className="flex items-center gap-2 text-white font-black">
            <Activity className="text-emerald-400" /> MediConnect © {new Date().getFullYear()}
          </div>
          <div className="flex gap-6 uppercase tracking-wider">
            <a href="#how-it-works" className="hover:text-emerald-400">How It Works</a>
            <a href="#security" className="hover:text-emerald-400">Security</a>
            <a href="#faq" className="hover:text-emerald-400">FAQ</a>
          </div>
          <p className="text-[10px] uppercase">Encrypted • AI Decision Support Platform</p>
        </footer>
      </section>

    </div>
  );
};

export default LandingPage;
