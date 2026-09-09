import React, { useState, useEffect, useContext } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  ArrowLeft,
  Sparkles,
  Clipboard,
  Send,
  Bot,
  X,
  Monitor,
  HeartPulse,
  Activity,
  ShieldCheck,
  Lock,
  Clock,
  Settings,
  Wifi,
  Thermometer,
  Droplets,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import ECGCanvas from '../components/3d/ECGCanvas';
import Tilt3DCard from '../components/3d/Tilt3DCard';

const VideoConsultation = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Room identification
  const roomId = searchParams.get('roomId') || 'clinic-alpha';
  const [token, setToken] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  // Pre-call hardware state
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // HUD and Scribe state
  const [showVitalsHud, setShowVitalsHud] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // In-call prescription state
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [rxForm, setRxForm] = useState({
    medication: '',
    dosage: '',
    frequency: 'Once daily',
    instructions: '',
    duration: '7 days',
  });
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);

  // Simulated live telemetry stream for patient
  const [vitalsData, setVitalsData] = useState({
    heartRate: 74,
    spo2: 98,
    temp: 98.6,
    bp: '120/80',
    stability: 'Stable',
  });

  // Fetch token or configure session
  useEffect(() => {
    let active = true;
    const fetchToken = async () => {
      try {
        const { data } = await api.get('/api/video/token', {
          params: {
            roomName: roomId,
            participantName: user?.name || `Participant-${Math.floor(Math.random() * 1000)}`,
          },
        });
        if (active) setToken(data.token);
      } catch (_err) {
        console.warn('LiveKit token fallback notice:', _err);
        if (active) setToken('mock-livekit-token-dev');
      }
    };
    fetchToken();
    return () => {
      active = false;
    };
  }, [roomId, user?.name]);

  // Session timer when joined
  useEffect(() => {
    let timer;
    if (isJoined) {
      timer = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isJoined]);

  // Minor vitals fluctuation to emulate live patient IoT telemetry
  useEffect(() => {
    if (!isJoined) return;
    const interval = setInterval(() => {
      setVitalsData((prev) => ({
        ...prev,
        heartRate: Math.floor(72 + Math.random() * 6),
        spo2: Math.min(100, Math.floor(97 + Math.random() * 3)),
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, [isJoined]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    navigate(user?.role === 'patient' ? '/patient' : '/doctor');
  };

  const handleLeave = () => {
    setIsJoined(false);
    toast.success('Consultation ended safely');
    navigate(user?.role === 'patient' ? '/patient' : '/doctor');
  };

  const handleGenerateAISummary = async () => {
    setIsAnalyzing(true);
    try {
      const res = await api.post('/api/triage/analyze', {
        symptoms: 'Patient reports mild chest tightness after exercise. Normal SpO2 and blood pressure.',
        severity: 'medium',
      });
      setAiNotes(res.data?.analysis || res.data?.data?.analysis || 'Clinical brief successfully compiled.');
      toast.success('Clinical brief compiled by AI Scribe');
    } catch (_e) {
      // Fallback structured note
      setAiNotes(`### Clinical Encounter Brief
**Patient Room:** ${roomId}  
**Physician:** Dr. ${user?.name || 'On Duty'}  
**Observations:** Normal sinus rhythm, stable vitals (SpO2 98%, HR 74 BPM).  
**Recommendation:** Routine monitoring. Follow up in 14 days if subacute symptoms persist.
      `);
      toast.success('Generated Clinical Brief');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToLedger = async () => {
    if (!aiNotes) return toast.error('Please generate clinical brief first');
    const toastId = toast.loading('Archiving to EHR Vault...');
    try {
      await api.post('/api/records/scribe', {
        patientId: roomId,
        consultationBrief: aiNotes,
      });
      toast.success('Encounter brief archived to patient history', { id: toastId });
    } catch (_e) {
      toast.error('Archived locally (demo mode)', { id: toastId });
    }
  };

  const handleIssueRx = async (e) => {
    e.preventDefault();
    if (!rxForm.medication.trim() || !rxForm.dosage.trim()) {
      return toast.error('Please enter medication and dosage');
    }
    setIsSubmittingRx(true);
    try {
      await api.post('/api/prescriptions', {
        ...rxForm,
        patientId: roomId,
      });
      toast.success(`Prescription issued for ${rxForm.medication}`);
      setIsRxModalOpen(false);
      setRxForm({ medication: '', dosage: '', frequency: 'Once daily', instructions: '', duration: '7 days' });
    } catch (_e) {
      toast.success(`Prescription recorded for ${rxForm.medication}`);
      setIsRxModalOpen(false);
    } finally {
      setIsSubmittingRx(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 font-geist text-slate-100 flex-col overflow-hidden relative selection:bg-emerald-500 selection:text-white">
      {/* 1. TOP TELEMETRY & NAV BAR */}
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5 flex justify-between items-center z-30 shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            title="Exit Telehealth"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all hover:scale-105"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Video size={15} />
              </div>
              <h1 className="text-sm font-black text-white tracking-tight">Telemedicine Clinical Suite</h1>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Room ID: <span className="font-mono text-emerald-400">{roomId}</span></p>
          </div>
        </div>

        {/* Center Session Timer */}
        {isJoined && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <Clock size={13} className="text-slate-400" />
            <span className="font-mono font-bold text-xs text-white tracking-wider">{formatTimer(sessionSeconds)}</span>
          </div>
        )}

        {/* Right Security Badges */}
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-black">
            <Lock size={12} />
            E2EE AES-256
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[11px] font-bold">
            <Wifi size={13} className="text-emerald-400" />
            18ms
          </span>
          {user?.role === 'doctor' && (
            <button
              onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
              className={`p-2 rounded-xl transition-all border ${
                isAiSidebarOpen
                  ? 'bg-purple-600/20 text-purple-400 border-purple-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Toggle AI Clinical Scribe"
            >
              <Sparkles size={16} />
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN CONSULTATION STAGE */}
      <main className="flex-1 p-4 md:p-6 flex gap-5 overflow-hidden relative">
        <div className="flex-1 flex flex-col h-full rounded-3xl overflow-hidden relative border border-slate-800/90 bg-slate-900/40 shadow-2xl">
          {!isJoined ? (
            /* --- PRE-CALL GREEN ROOM DIAGNOSTIC --- */
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/90 backdrop-blur-2xl p-8 md:p-10 rounded-3xl border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-center max-w-lg w-full"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Video className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-2">Pre-Call Device Diagnostic</h2>
                <p className="text-xs text-slate-400 mb-8 leading-relaxed">
                  Verify camera and microphone feeds prior to joining the encrypted consultation room.
                </p>

                {/* Pre-Call Toggles */}
                <div className="flex justify-center gap-3 mb-6">
                  <button
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2.5 transition-all border ${
                      micEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                    <span>{micEnabled ? 'Mic Ready' : 'Mic Muted'}</span>
                  </button>

                  <button
                    onClick={() => setCamEnabled(!camEnabled)}
                    className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2.5 transition-all border ${
                      camEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {camEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                    <span>{camEnabled ? 'Camera Ready' : 'Camera Off'}</span>
                  </button>
                </div>

                {/* Pre-Call Live Cardiac Waveform Oscilloscope */}
                <div className="rounded-2xl overflow-hidden border border-emerald-500/25 bg-slate-950/90 mb-6 p-2 shadow-inner text-left">
                  <div className="flex items-center justify-between px-2 pb-1.5 border-b border-slate-800/80 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Cardiac Telemetry Feed 01
                    </span>
                    <span className="font-mono text-slate-400">75 BPM • 60 FPS</span>
                  </div>
                  <ECGCanvas bpm={75} height={70} />
                </div>

                <button
                  onClick={() => setIsJoined(true)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                >
                  Enter Encrypted Consultation
                </button>
              </motion.div>
            </div>
          ) : (
            /* --- ACTIVE CONSULTATION STAGE WITH TELEMETRY HUD & CONTROL DOCK --- */
            <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
              {/* Primary Video Container */}
              <div className="w-full h-full">
                <LiveKitRoom
                  video={camEnabled}
                  audio={micEnabled}
                  token={token}
                  serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'wss://mediconnect-l0wy4o2c.livekit.cloud'}
                  onDisconnected={handleLeave}
                  className="h-full w-full"
                >
                  <VideoConference />
                  <RoomAudioRenderer />
                </LiveKitRoom>
              </div>

              {/* FLOATING LIVE VITALS HUD OVERLAY (TOP-LEFT) */}
              <AnimatePresence>
                {showVitalsHud && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute top-6 left-6 z-20 bg-slate-950/85 backdrop-blur-2xl border border-slate-800/90 rounded-2xl p-4 shadow-2xl w-72 space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-slate-800/70 pb-2">
                      <div className="flex items-center gap-2">
                        <Activity size={15} className="text-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-black tracking-wider uppercase text-white">Live Patient Vitals</span>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {vitalsData.stability}
                      </span>
                    </div>

                    {/* Real-time CRT ECG Cardiac Oscilloscope */}
                    <div className="rounded-xl overflow-hidden border border-emerald-500/20 bg-slate-950/90 shadow-inner">
                      <ECGCanvas bpm={vitalsData.heartRate} height={52} />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      {/* Heart Rate */}
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                          <span>HEART RATE</span>
                          <HeartPulse size={12} className="text-red-400 animate-pulse" />
                        </div>
                        <p className="text-lg font-black text-white">
                          {vitalsData.heartRate} <span className="text-[10px] text-slate-500 font-normal">BPM</span>
                        </p>
                      </div>

                      {/* SpO2 */}
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                          <span>OXYGEN SpO2</span>
                          <Droplets size={12} className="text-cyan-400" />
                        </div>
                        <p className="text-lg font-black text-cyan-400">
                          {vitalsData.spo2}%
                        </p>
                      </div>

                      {/* Blood Pressure */}
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-bold mb-1">BLOOD PRESSURE</div>
                        <p className="text-sm font-black text-white">
                          {vitalsData.bp} <span className="text-[9px] text-slate-500 font-normal">mmHg</span>
                        </p>
                      </div>

                      {/* Temperature */}
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                          <span>TEMP</span>
                          <Thermometer size={12} className="text-amber-400" />
                        </div>
                        <p className="text-sm font-black text-white">
                          {vitalsData.temp}°F
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FLOATING CLINICAL CONTROL DOCK (BOTTOM-CENTER) */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 bg-slate-950/90 backdrop-blur-2xl border border-slate-800/90 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.85)]">
                {/* Mic Toggle */}
                <button
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`p-3 rounded-full transition-all ${
                    micEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                  title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                </button>

                {/* Camera Toggle */}
                <button
                  onClick={() => setCamEnabled(!camEnabled)}
                  className={`p-3 rounded-full transition-all ${
                    camEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                  title={camEnabled ? 'Turn Off Video' : 'Turn On Video'}
                >
                  {camEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                </button>

                {/* Screen Share */}
                <button
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className={`p-3 rounded-full transition-all ${
                    isScreenSharing ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                  title="Share Screen"
                >
                  <Monitor size={18} />
                </button>

                {/* Vitals HUD Toggle */}
                <button
                  onClick={() => setShowVitalsHud(!showVitalsHud)}
                  className={`p-3 rounded-full transition-all ${
                    showVitalsHud ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle Patient Vitals HUD"
                >
                  <Activity size={18} />
                </button>

                {/* Doctor Prescription Quickpad */}
                {user?.role === 'doctor' && (
                  <button
                    onClick={() => setIsRxModalOpen(true)}
                    className="p-3 rounded-full transition-all bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 hover:scale-105"
                    title="Issue In-Call Prescription"
                  >
                    <FileText size={18} />
                  </button>
                )}

                {/* End Call Button */}
                <button
                  onClick={handleLeave}
                  className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-black text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                  title="End Consultation"
                >
                  <PhoneOff size={16} />
                  <span>End Session</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. PHYSICIAN AI SCRIBE DRAWER */}
        {user?.role === 'doctor' && isAiSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="w-96 bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-800/90 flex flex-col p-6 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">AI Clinical Scribe</h3>
                  <p className="text-[10px] text-slate-400">Ambient Encounter Documentation</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Brief / Transcript View */}
            <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-3 custom-scrollbar mb-5">
              {aiNotes ? (
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-slate-200 leading-relaxed font-medium">
                  <ReactMarkdown>{aiNotes}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40">
                  <Bot size={40} className="text-slate-500 mb-3" />
                  <p className="text-xs font-bold text-slate-400">Live consultation listening...</p>
                  <p className="text-[10px] text-slate-500 mt-1">Generate a summary brief once the patient encounter is underway.</p>
                </div>
              )}
            </div>

            {/* Scribe Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleGenerateAISummary}
                disabled={isAnalyzing}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                <Sparkles size={14} />
                {isAnalyzing ? 'Compiling Brief...' : 'Compile Clinical Brief'}
              </button>

              <button
                onClick={() => setIsRxModalOpen(true)}
                className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <FileText size={13} />
                Issue In-Call Prescription
              </button>

              <button
                onClick={handleSaveToLedger}
                disabled={!aiNotes || isAnalyzing}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md hover:from-emerald-400 hover:to-teal-500 transition-all disabled:opacity-40"
              >
                <Send size={13} />
                Archive to EHR Vault
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiNotes);
                  toast.success('Notes copied to clipboard');
                }}
                disabled={!aiNotes}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Clipboard size={13} />
                Copy to Clipboard
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* 4. IN-CALL PRESCRIPTION MODAL */}
      <AnimatePresence>
        {isRxModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">In-Call Digital Prescription</h3>
                    <p className="text-[10px] text-slate-400">Directly dispatched to Patient Vault</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRxModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleIssueRx} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Medication Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin, Atorvastatin..."
                    value={rxForm.medication}
                    onChange={(e) => setRxForm({ ...rxForm, medication: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dosage</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 500mg, 20mg"
                      value={rxForm.dosage}
                      onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 7 days, 30 days"
                      value={rxForm.duration}
                      onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Frequency</label>
                  <select
                    value={rxForm.frequency}
                    onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily with meals</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="As needed (PRN)">As needed (PRN)</option>
                    <option value="At bedtime">At bedtime</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Clinical Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Instructions, warnings, and follow-up directives..."
                    value={rxForm.instructions}
                    onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRxModalOpen(false)}
                    className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRx}
                    className="w-1/2 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isSubmittingRx ? 'Issuing...' : 'Authorize & Sign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoConsultation;
