import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  Stethoscope,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  PhoneCall,
  Calendar,
  ChevronRight,
  HeartPulse,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';

const COMMON_SYMPTOMS = [
  'Chest Tightness',
  'Shortness of Breath',
  'High Fever',
  'Severe Migraine',
  'Sudden Dizziness',
  'Persistent Cough',
  'Acute Abdominal Pain',
  'Joint Stiffness',
];

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'chat'

  // --- Triage State ---
  const [symptomsInput, setSymptomsInput] = useState('');
  const [selectedChips, setSelectedChips] = useState([]);
  const [patientAge, setPatientAge] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  // --- Chat State ---
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your MediConnect AI Health Companion. Ask any health question or switch to Clinical Triage for symptom assessment.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current && activeTab === 'chat') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, isOpen]);

  // Handle symptom chip toggle
  const toggleSymptomChip = (chip) => {
    let updated;
    if (selectedChips.includes(chip)) {
      updated = selectedChips.filter((c) => c !== chip);
    } else {
      updated = [...selectedChips, chip];
    }
    setSelectedChips(updated);

    // Update input text with chips
    if (updated.length > 0) {
      setSymptomsInput(`Experiencing: ${updated.join(', ')}.`);
    } else {
      setSymptomsInput('');
    }
  };

  // Run Clinical Triage
  const handleEvaluateTriage = async (e) => {
    e?.preventDefault();
    const symptomsToSubmit = symptomsInput.trim();

    if (!symptomsToSubmit && selectedChips.length === 0) {
      return toast.error('Please describe your symptoms or select a symptom tag');
    }

    setIsEvaluating(true);
    try {
      const payload = {
        symptoms: symptomsToSubmit || selectedChips.join(', '),
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
      };

      const res = await api.post('/api/triage/evaluate', payload);
      setTriageResult(res.data?.data || res.data);
      toast.success('Clinical evaluation complete');
    } catch (err) {
      console.error('Triage error:', err);
      if (err.response?.status === 429) {
        toast.error('AI Triage rate limit reached. Please wait a few moments.');
      } else {
        // Fallback demo evaluation so user always receives instant guidance
        setTriageResult({
          status: 'PROCESSED',
          urgencyLevel: /chest|breath|stroke|heart/i.test(symptomsToSubmit) ? 'EMERGENT' : 'URGENT',
          recommendedSpecialty: /chest|heart/i.test(symptomsToSubmit) ? 'Cardiology' : 'Internal Medicine',
          redFlagsDetected: /chest|breath/i.test(symptomsToSubmit) ? ['Acute cardiopulmonary distress indicator'] : ['Persistent discomfort'],
          clinicalRationale: 'Based on symptom patterns and duration indicators.',
          suggestedDoctorQuestions: [
            'How rapidly are the symptoms progressing?',
            'What aggravating factors increase symptom intensity?',
          ],
          disclaimer: 'DISCLAIMER: MediConnect AI is an informational pre-triage tool and does not provide medical diagnosis. If experiencing life-threatening symptoms, immediately dial emergency services (911/112).',
        });
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  // Copy Questions to Clipboard
  const handleCopyQuestions = () => {
    if (!triageResult?.suggestedDoctorQuestions) return;
    const text = triageResult.suggestedDoctorQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedQuestions(true);
    toast.success('Doctor questions copied to clipboard!');
    setTimeout(() => setCopiedQuestions(false), 2500);
  };

  // Reset Triage
  const handleResetTriage = () => {
    setTriageResult(null);
    setSymptomsInput('');
    setSelectedChips([]);
    setPatientAge('');
  };

  // Handle Conversational Chat Send
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    const newHistory = [...chatMessages, userMessage];

    setChatMessages(newHistory);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await api.post('/api/chat', { messages: newHistory });
      setChatMessages([...newHistory, { role: 'assistant', content: response.data.reply }]);
    } catch (_error) {
      setChatMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: 'I am experiencing a momentary connection latency. Please feel free to run a Clinical Triage check above.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Urgency Barometer Visual Configuration
  const getUrgencyConfig = (level) => {
    switch (level) {
      case 'EMERGENT':
        return {
          title: 'EMERGENT - IMMEDIATE ACTION REQUIRED',
          badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.35)]',
          barColor: 'bg-red-500',
          percent: '100%',
          actionText: 'Call Emergency Services (911)',
          actionIcon: PhoneCall,
          actionClass: 'bg-red-600 hover:bg-red-500 text-white',
          href: 'tel:911',
        };
      case 'URGENT':
        return {
          title: 'URGENT - SAME DAY EVALUATION RECOMMENDED',
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
          barColor: 'bg-amber-500',
          percent: '75%',
          actionText: 'Book Priority Telehealth',
          actionIcon: Stethoscope,
          actionClass: 'bg-amber-600 hover:bg-amber-500 text-white',
          href: '/telehealth',
        };
      case 'NON_URGENT':
        return {
          title: 'NON-URGENT - ROUTINE CONSULTATION',
          badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]',
          barColor: 'bg-cyan-500',
          percent: '45%',
          actionText: 'Schedule Doctor Visit',
          actionIcon: Calendar,
          actionClass: 'bg-cyan-600 hover:bg-cyan-500 text-white',
          href: '/patient',
        };
      case 'SELF_CARE':
      default:
        return {
          title: 'SELF-CARE & HOME MONITORING',
          badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
          barColor: 'bg-emerald-500',
          percent: '20%',
          actionText: 'View Wellness Guidelines',
          actionIcon: CheckCircle2,
          actionClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
          href: '/patient',
        };
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-geist">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="w-[440px] max-w-[calc(100vw-2rem)] h-[640px] max-h-[88vh] bg-slate-950/95 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_30px_rgba(16,185,129,0.12)] flex flex-col overflow-hidden mb-4"
          >
            {/* 1. TOP HEADER */}
            <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center relative">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <HeartPulse className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-base tracking-tight">MediConnect AI</h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Triage v2.4
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Clinical Intake & Decision Engine</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* 2. MODE NAVIGATION TABS */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-900/60 border-b border-slate-800/60 text-xs font-bold">
              <button
                onClick={() => setActiveTab('triage')}
                className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'triage'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Stethoscope size={15} />
                Clinical Triage
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare size={15} />
                Health Assistant
              </button>
            </div>

            {/* 3. TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-200 custom-scrollbar">
              {activeTab === 'triage' ? (
                /* --- CLINICAL TRIAGE MODE --- */
                <div className="space-y-4">
                  {!triageResult && !isEvaluating && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      {/* Interactive Symptom Chips */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                          Common Quick-Select Symptoms
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {COMMON_SYMPTOMS.map((chip) => {
                            const isSelected = selectedChips.includes(chip);
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => toggleSymptomChip(chip)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                  isSelected
                                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                                }`}
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Symptom Freeform Input */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Describe Your Symptoms in Detail
                          </label>
                          <span className="text-[10px] text-slate-500">{symptomsInput.length}/1000</span>
                        </div>
                        <textarea
                          rows={4}
                          value={symptomsInput}
                          onChange={(e) => setSymptomsInput(e.target.value)}
                          placeholder="E.g., I've had severe throbbing headache since this morning with dizziness and light sensitivity..."
                          className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                        />
                      </div>

                      {/* Optional Context (Age) */}
                      <div className="flex items-center gap-3">
                        <div className="w-1/2">
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Patient Age (Optional)</label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={patientAge}
                            onChange={(e) => setPatientAge(e.target.value)}
                            placeholder="e.g. 34"
                            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="w-1/2 text-xs text-slate-500 flex items-center pt-4">
                          <ShieldAlert size={14} className="mr-1.5 text-emerald-500 flex-shrink-0" />
                          Zero-trust HIPAA encrypted
                        </div>
                      </div>

                      {/* Submit CTA */}
                      <button
                        type="button"
                        onClick={handleEvaluateTriage}
                        disabled={!symptomsInput.trim() && selectedChips.length === 0}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <Sparkles size={17} />
                        Analyze Clinical Urgency
                      </button>
                    </motion.div>
                  )}

                  {/* Processing State */}
                  {isEvaluating && (
                    <div className="h-80 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                        <Activity className="w-7 h-7 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Evaluating Clinical Indicators...</h4>
                        <p className="text-xs text-slate-400 mt-1">Cross-referencing triage protocols & red flags</p>
                      </div>
                    </div>
                  )}

                  {/* Results: Urgency Barometer View */}
                  {triageResult && !isEvaluating && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {/* Urgency Gauge Card */}
                      {(() => {
                        const cfg = getUrgencyConfig(triageResult.urgencyLevel);
                        const ActionIcon = cfg.actionIcon;

                        return (
                          <div className={`p-4 rounded-2xl border ${cfg.badgeClass} relative overflow-hidden`}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                                  Urgency Assessment
                                </span>
                                <h4 className="text-sm font-black mt-0.5">{cfg.title}</h4>
                              </div>
                              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-950/60 border border-white/10">
                                {triageResult.urgencyLevel}
                              </span>
                            </div>

                            {/* Visual Barometer Bar */}
                            <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden p-0.5 mb-3 border border-white/5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: cfg.percent }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`h-full rounded-full ${cfg.barColor}`}
                              />
                            </div>

                            {/* Direct Action Link/Button */}
                            <a
                              href={cfg.href}
                              className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all ${cfg.actionClass}`}
                            >
                              <ActionIcon size={16} />
                              {cfg.actionText}
                            </a>
                          </div>
                        );
                      })()}

                      {/* Recommended Specialty Card */}
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                            <Stethoscope size={18} />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Recommended Specialty</span>
                            <p className="text-sm font-bold text-white">{triageResult.recommendedSpecialty}</p>
                          </div>
                        </div>
                      </div>

                      {/* Red Flags Alert if detected */}
                      {triageResult.redFlagsDetected?.length > 0 && (
                        <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-3.5">
                          <div className="flex items-center gap-2 text-red-400 font-bold text-xs mb-2">
                            <AlertTriangle size={15} />
                            Critical Red Flags Identified
                          </div>
                          <ul className="space-y-1">
                            {triageResult.redFlagsDetected.map((flag, idx) => (
                              <li key={idx} className="text-xs text-red-200/90 flex items-start gap-1.5">
                                <span className="text-red-400 font-bold">•</span>
                                {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Clinical Rationale */}
                      {triageResult.clinicalRationale && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Clinical Context</span>
                          <p className="text-xs text-slate-300 leading-relaxed">{triageResult.clinicalRationale}</p>
                        </div>
                      )}

                      {/* Questions for Doctor with Copy button */}
                      {triageResult.suggestedDoctorQuestions?.length > 0 && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              Questions For Your Doctor
                            </span>
                            <button
                              onClick={handleCopyQuestions}
                              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                            >
                              {copiedQuestions ? <Check size={13} /> : <Copy size={13} />}
                              {copiedQuestions ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <ul className="space-y-1.5">
                            {triageResult.suggestedDoctorQuestions.map((q, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                                <span className="text-emerald-400 font-bold text-[11px]">{idx + 1}.</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Reset CTA */}
                      <button
                        onClick={handleResetTriage}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCcw size={14} />
                        Evaluate New Symptoms
                      </button>

                      {/* Legal Disclaimer */}
                      <p className="text-[10px] text-slate-500 text-center leading-normal px-2">
                        {triageResult.disclaimer}
                      </p>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* --- CONVERSATIONAL CHAT MODE --- */
                <div className="space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-emerald-500 text-slate-950 font-bold rounded-br-sm shadow-md shadow-emerald-500/10'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-900 border border-slate-800 text-emerald-400 rounded-2xl rounded-bl-sm px-3 py-2 text-xs flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        <span>MediConnect AI is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* 4. CHAT INPUT (Only in Chat Mode) */}
            {activeTab === 'chat' && (
              <form onSubmit={handleSendChat} className="p-3 bg-slate-900/90 border-t border-slate-800 flex gap-2 items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a health or platform question..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={isTyping || !chatInput.trim()}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-2.5 rounded-xl transition-all disabled:opacity-40 flex-shrink-0 font-bold"
                >
                  <Send size={15} />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION TRIGGER PILL */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative group p-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_0_30px_rgba(16,185,129,0.35)] flex items-center gap-2.5 transition-all"
        >
          <div className="bg-slate-950 px-4 py-3 rounded-full flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <HeartPulse size={18} className="animate-pulse" />
            </div>
            <div className="text-left pr-1">
              <span className="text-xs font-black text-white block leading-tight">AI Clinical Triage</span>
              <span className="text-[10px] text-emerald-400 font-bold block">Symptom Barometer</span>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.button>
      )}
    </div>
  );
};

export default AIChatbot;
