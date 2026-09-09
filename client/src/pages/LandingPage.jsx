import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Activity, HeartPulse, Sparkles, ArrowRight, Users, 
  ChevronDown, Stethoscope, CheckCircle2, Lock, UserCheck, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Hero3DScene from '../components/3d/Hero3DScene';
import Tilt3DCard from '../components/3d/Tilt3DCard';
import InteractiveTriage3D from '../components/landing/InteractiveTriage3D';
import TelehealthSimulator3D from '../components/landing/TelehealthSimulator3D';
import VitalsTelemetry3D from '../components/landing/VitalsTelemetry3D';
import DoctorBooking3D from '../components/landing/DoctorBooking3D';
import SecurityVault3D from '../components/landing/SecurityVault3D';
import PharmacyDelivery3D from '../components/landing/PharmacyDelivery3D';

const LandingPage = () => {
  const { user } = useContext(AuthContext);

  // Navigation link helper
  const getDashboardLink = () => {
    if (!user) return '/register';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'doctor') return '/doctor';
    return '/patient';
  };

  // Audience Persona Tab State
  const [activePersona, setActivePersona] = useState('patients');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  const personas = {
    patients: {
      title: 'Built for Patients Who Deserve Effortless Healthcare',
      desc: 'Skip crowded waiting rooms. Get instant clinical triage, video consults with top specialists, and lifetime access to your encrypted health records.',
      bullets: [
        'Instant AI symptom triage with clear severity guidance',
        'Direct 1-on-1 HD video consults with verified clinicians',
        'Continuous remote biometric telemetry syncing',
        'Zero-knowledge encrypted EMR records available 24/7'
      ],
      cta: 'Get Patient Access',
      link: '/register'
    },
    doctors: {
      title: 'Engineered for Modern Clinicians & Practices',
      desc: 'Empower your clinical workflow. Let AI handle intake scribing and pre-consult triage while you focus on patient care and diagnostic excellence.',
      bullets: [
        'Automated real-time AI clinical scribing during consultations',
        'Live patient vitals & telemetry telemetry overlay',
        'Customizable availability schedules & integrated invoicing',
        'Built-in HIPAA and BAA compliant record archiving'
      ],
      cta: 'Join Doctor Network',
      link: '/register'
    },
    clinics: {
      title: 'Enterprise Architecture for Hospitals & Clinics',
      desc: 'Deploy a unified, compliant telehealth infrastructure across multi-specialty departments with full administrative oversight and auditability.',
      bullets: [
        'Centralized multi-doctor administrative management console',
        'Tamper-proof cryptographic audit trails for all actions',
        'FHIR and HL7 compatible data architecture',
        '99.98% platform SLA with dedicated 24/7 technical support'
      ],
      cta: 'Request Enterprise Demo',
      link: '/register'
    }
  };

  const faqs = [
    {
      q: 'How does MediConnect’s AI clinical triage work?',
      a: 'Our neural triage engine analyzes multi-factor symptom profiles, duration, patient age, and reported pain thresholds against evidence-based medical triage protocols. It calculates an urgency index (Emergency Red Flag, Urgent, Moderate, Routine) to guide patients toward the appropriate level of care.'
    },
    {
      q: 'Are video consultations end-to-end encrypted?',
      a: 'Yes. Video and audio streams are transmitted peer-to-peer using WebRTC with DTLS-SRTP and AES-256-GCM encryption. No unencrypted audio or video passes through intermediate servers, preserving complete doctor-patient confidentiality.'
    },
    {
      q: 'Can I connect wearable devices or monitors for continuous vitals?',
      a: 'MediConnect supports continuous telemetry streaming including heart rate, SpO2, and blood pressure. Automated pipelines monitor threshold breaches (such as sudden tachycardia or hypoxia) and immediately trigger care escalation alerts.'
    },
    {
      q: 'Is MediConnect compliant with healthcare regulations like HIPAA?',
      a: 'Yes, MediConnect is built from the ground up in adherence with HIPAA Security & Privacy Rules and GDPR standards. All stored patient records are encrypted at rest using AES-256 with verifiable SHA-256 tamper-proof audit trails.'
    },
    {
      q: 'How quickly can I consult with a licensed doctor?',
      a: 'Through our verified network, patients can connect with on-demand general physicians in as little as 5 minutes, or schedule appointments with board-certified specialists (Cardiology, Pediatrics, Neurology, etc.) for same-day consultations.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      
      {/* 1. TOP ANNOUNCEMENT & SYSTEM STATUS STRIP */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-2 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-black tracking-wider uppercase">SYSTEM ONLINE</span>
            <span className="text-slate-600">|</span>
            <span>100% HIPAA & GDPR Compliant Infrastructure</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Latency: 14ms</span>
            <span>•</span>
            <span>Uptime: 99.98%</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">E2EE Active</span>
          </div>
        </div>
      </div>

      {/* 2. MODERN GLASSMORPHIC NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-300">
              <Activity className="text-slate-950 w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                MediConnect
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold -mt-1">
                3D Telehealth OS
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#triage" className="hover:text-emerald-400 transition-colors">01 AI Triage</a>
            <a href="#telehealth" className="hover:text-emerald-400 transition-colors">02 WebRTC</a>
            <a href="#vitals" className="hover:text-emerald-400 transition-colors">03 Wearables</a>
            <a href="#records" className="hover:text-emerald-400 transition-colors">04 EMR Vault</a>
            <a href="#pharmacy" className="hover:text-emerald-400 transition-colors">05 Pharmacy</a>
            <a href="#doctors" className="hover:text-emerald-400 transition-colors">Specialists</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 flex items-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <Link
                to={getDashboardLink()}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                <Users size={14} />
                <span>My Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION WITH 3D INTERACTIVE CANVAS */}
      <section className="relative pt-12 pb-24 px-6 overflow-hidden">
        {/* Dynamic Background Radial Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
          {/* Hero Header */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 animate-fade-in">
              <Sparkles size={15} className="animate-spin-slow text-emerald-400" />
              <span>Next-Gen 3D AI Health Infrastructure</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] text-white">
              Healthcare,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                reimagined in 3D.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
              AI-driven clinical triage, zero-latency WebRTC video consultations, live biometric telemetry, and tamper-proof EMR records — connected into one seamless ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <Link
                to={getDashboardLink()}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-xl shadow-emerald-500/30 hover:scale-105 flex items-center justify-center gap-3"
              >
                <span>{user ? 'Enter Workspace' : 'Experience MediConnect'}</span>
                <ArrowRight size={18} />
              </Link>
              <a
                href="#triage"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-black text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <Sparkles size={16} className="text-emerald-400" />
                <span>Try Live AI Triage Demo</span>
              </a>
            </div>

            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-lg mx-auto">
              Clinical Decision Support System • Does not replace emergency services
            </p>
          </div>

          {/* Hero 3D Interactive Canvas & Floating Perspective HUD */}
          <div className="relative w-full max-w-6xl mx-auto">
            <div className="relative rounded-[2.5rem] bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/80 shadow-2xl overflow-hidden p-2 sm:p-4">
              {/* The 3D Canvas Scene */}
              <Hero3DScene activeMode="dna" />

              {/* Overlaid 3D Perspective HUD Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <Tilt3DCard className="p-5 bg-slate-950/90 border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase">
                    <Sparkles size={16} /> Intelligent Triage
                  </div>
                  <p className="text-sm font-bold text-white">Algorithmic Red-Flag Safety Screen</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Active Guidance
                    </span>
                    <span>Confidence: 98.4%</span>
                  </div>
                </Tilt3DCard>

                <Tilt3DCard className="p-5 bg-slate-950/90 border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-black uppercase">
                    <UserCheck size={16} /> Verified Clinicians
                  </div>
                  <p className="text-sm font-bold text-white">Board-Certified Specialists</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                      Cardiology • Neuro • Peds
                    </span>
                  </div>
                </Tilt3DCard>

                <Tilt3DCard className="p-5 bg-slate-950/90 border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase">
                    <HeartPulse size={16} /> Continuous Telemetry
                  </div>
                  <p className="text-sm font-bold text-white">Real-Time ECG & Biometric Sync</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      60 FPS CRT Stream
                    </span>
                    <span>14ms Latency</span>
                  </div>
                </Tilt3DCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCTION VALUE & METRICS STRIP */}
      <section className="py-12 border-y border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                50,000+
              </span>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Consultations Handled
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400">
                &lt; 60s
              </span>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Average Triage Response
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                99.98%
              </span>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Telehealth SLA Uptime
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                4.95 / 5
              </span>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Patient Satisfaction Score
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CORE FEATURE 01: AI SYMPTOM CHECKER & DOCTOR TRIAGE QUEUE */}
      <section id="triage" className="py-24 px-6 relative bg-gradient-to-b from-[#030712] via-slate-900/30 to-[#030712]">
        <InteractiveTriage3D />
      </section>

      {/* 6. CORE FEATURE 02: REAL-TIME P2P TELEHEALTH (NATIVE WEBRTC) */}
      <section id="telehealth" className="py-24 px-6 border-y border-slate-800/80 bg-slate-950/40">
        <TelehealthSimulator3D />
      </section>

      {/* 7. CORE FEATURE 03: LIVE WEARABLES & VITALS TELEMETRY STREAM */}
      <section id="vitals" className="py-24 px-6 relative">
        <VitalsTelemetry3D />
      </section>

      {/* 8. CORE FEATURE 04: IMMUTABLE MEDICAL RECORDS (EMR) VAULT */}
      <section id="records" className="py-24 px-6 border-y border-slate-800/80 bg-slate-950/40">
        <SecurityVault3D />
      </section>

      {/* 9. CORE FEATURE 05: PHARMACY GEOLOCATION & PRESCRIPTION DELIVERY */}
      <section id="pharmacy" className="py-24 px-6 relative">
        <PharmacyDelivery3D />
      </section>

      {/* 10. SPECIALIST DISCOVERY & APPOINTMENT SCHEDULING */}
      <section id="doctors" className="py-24 px-6 border-y border-slate-800/80 bg-slate-950/40">
        <DoctorBooking3D />
      </section>

      {/* 9. TAILORED PERSONA WORKFLOWS */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Personalized Workflows
            </span>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Tailored for Every Stage of Care
            </h3>
          </div>

          {/* Persona Switcher Tabs */}
          <div className="flex justify-center gap-3">
            {[
              { id: 'patients', label: 'For Patients', icon: Users },
              { id: 'doctors', label: 'For Clinicians', icon: Stethoscope },
              { id: 'clinics', label: 'For Hospitals', icon: Layers }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePersona(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    activePersona === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/25 scale-105'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Persona Card */}
          <Tilt3DCard className="p-8 sm:p-12 bg-slate-900/90 border-slate-800 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <h4 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {personas[activePersona].title}
                </h4>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
                  {personas[activePersona].desc}
                </p>
                <div className="space-y-3 pt-2">
                  {personas[activePersona].bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-bold">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} />
                      </div>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Link
                    to={personas[activePersona].link}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <span>{personas[activePersona].cta}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-3">
                    <span className="text-emerald-400 font-bold uppercase">Dedicated Portal</span>
                    <span>Role-Based Access</span>
                  </div>
                  <div className="space-y-3 text-xs text-slate-300">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                      <span className="font-bold">Encryption Protocol</span>
                      <span className="font-mono text-emerald-400">DTLS-SRTP 256</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                      <span className="font-bold">Record Storage</span>
                      <span className="font-mono text-teal-400">HIPAA Compliant</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                      <span className="font-bold">Intelligent Scribing</span>
                      <span className="font-mono text-cyan-400">Real-Time</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tilt3DCard>
        </div>
      </section>


      {/* 11. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Clear & Transparent
            </span>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h3>
            <p className="text-slate-400 text-sm max-w-lg mx-auto font-medium">
              Everything you need to know about our clinical standards, encryption, and tele-consultation process.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-hidden transition-all duration-300 hover:border-slate-700"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left font-black text-white text-base flex justify-between items-center gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180 text-teal-300' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6 text-sm font-medium text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4"
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

      {/* 12. HIGH-CONVERSION CTA & MODERN FOOTER */}
      <section className="py-24 px-6 text-center space-y-12 bg-gradient-to-b from-[#030712] via-slate-950 to-slate-900 border-t border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Your next healthcare step,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 italic">
              connected around you.
            </span>
          </h2>
          <p className="text-slate-300 font-medium text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Begin your journey with MediConnect today for instant AI triage, immediate doctor access, and secure medical record ownership.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-xl shadow-emerald-500/30 hover:scale-105 flex items-center justify-center gap-3"
            >
              <span>Create Free Account</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-black text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105"
            >
              Doctor & Admin Login
            </Link>
          </div>
        </div>

        {/* Global Footer */}
        <footer className="pt-16 border-t border-slate-800/80 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-400 font-bold relative z-10">
          <div className="flex items-center gap-3 text-white font-black">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950">
              <Activity size={18} className="stroke-[2.5]" />
            </div>
            <span className="text-base tracking-tight">MediConnect Health</span>
            <span className="text-slate-600 font-normal">© {new Date().getFullYear()}</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 uppercase tracking-wider text-[11px]">
            <a href="#triage" className="hover:text-emerald-400 transition-colors">AI Triage</a>
            <a href="#telehealth" className="hover:text-emerald-400 transition-colors">Telehealth</a>
            <a href="#vitals" className="hover:text-emerald-400 transition-colors">Vitals</a>
            <a href="#doctors" className="hover:text-emerald-400 transition-colors">Doctors</a>
            <a href="#security" className="hover:text-emerald-400 transition-colors">Security</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px] uppercase text-slate-500">
            <Lock size={12} className="text-emerald-400" />
            <span>End-to-End Encrypted • HIPAA Compliant</span>
          </div>
        </footer>
      </section>

    </div>
  );
};

export default LandingPage;
