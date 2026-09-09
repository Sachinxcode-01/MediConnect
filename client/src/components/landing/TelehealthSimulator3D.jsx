import React, { useState, useEffect } from 'react';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, ShieldCheck, 
  MessageSquare, Sparkles, FileText, Monitor, Volume2, User,
  CheckCircle2, Radio, Lock
} from 'lucide-react';
import Tilt3DCard from '../3d/Tilt3DCard';

const TelehealthSimulator3D = () => {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(142); // in seconds
  const liveTranscript = [
    { speaker: 'Dr. Maya Rao', time: '02:18', text: 'I am reviewing your continuous heart rate telemetry right now. Rhythm is sinus.' },
    { speaker: 'Patient (You)', time: '02:22', text: 'Thank you doctor, the tightness subsided after 15 minutes.' },
    { speaker: 'AI Scribe', time: '02:24', text: '[Recorded] Episode of transient chest discomfort. Vital signs stable.' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
          <Radio size={14} className="animate-pulse" /> Core Feature 02 • Native HTML5 WebRTC P2P Telehealth
        </div>
        <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          In-Browser P2P Encrypted Video Consultations
        </h3>
        <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">
          Built on native <code className="text-emerald-400 font-mono text-xs">RTCPeerConnection</code> and Socket.io signaling (<code className="text-slate-300 font-mono text-xs">offer / answer / ice-candidate</code>). Zero third-party app installations required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Video Stream Window */}
        <div className="lg:col-span-8 flex flex-col">
          <Tilt3DCard className="flex-1 flex flex-col justify-between p-6 bg-slate-950/90 border-slate-800 shadow-2xl relative min-h-[460px]">
            {/* Top Status Bar */}
            <div className="flex justify-between items-center z-20">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold font-mono">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  LIVE • {formatTime(callDuration)}
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono">
                  <Lock size={12} className="text-emerald-400" />
                  AES-256 E2EE
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800">
                <span className="text-emerald-400">1080p 60fps</span>
                <span>•</span>
                <span>14ms Latency</span>
              </div>
            </div>

            {/* Simulated Clinician Video Canvas / Viewport */}
            <div className="relative my-auto flex flex-col items-center justify-center py-10 z-10">
              {/* Doctor Avatar with Animated Glowing Holographic Aura */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/30 to-teal-400/30 rounded-full blur-xl animate-pulse"></div>
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-1 relative shadow-2xl">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400"
                      alt="Dr. Maya Rao"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-md">
                  <ShieldCheck size={14} />
                </div>
              </div>

              <div className="text-center mt-4 space-y-1">
                <h5 className="font-black text-lg text-white">Dr. Maya Rao, MD</h5>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Chief of Cardiology • Online</p>
              </div>

              {/* Audio Spectrum Bars Simulation */}
              <div className="flex items-center gap-1 mt-4 h-6">
                {[4, 12, 18, 24, 14, 8, 20, 16, 6, 14, 22, 10, 5].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-emerald-400 rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: '0.8s',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Floating Self Patient Preview (PIP) */}
            <div className="absolute bottom-24 right-6 w-36 h-24 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden hidden sm:flex items-center justify-center z-20">
              {isVideoOff ? (
                <div className="text-center text-[10px] text-slate-400 font-bold">Camera Off</div>
              ) : (
                <div className="relative w-full h-full bg-slate-800 flex items-center justify-center">
                  <User size={28} className="text-slate-400" />
                  <span className="absolute bottom-1.5 left-2 text-[9px] font-bold text-slate-300">You (Patient)</span>
                </div>
              )}
            </div>

            {/* Interactive Call Controls Dock */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-800/80 z-20">
              <button
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`p-3.5 rounded-2xl transition-all duration-300 ${
                  isMicMuted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3.5 rounded-2xl transition-all duration-300 ${
                  isVideoOff
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`p-3.5 rounded-2xl transition-all duration-300 ${
                  isScreenSharing
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                <Monitor size={20} />
              </button>

              <button
                className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-red-600/30"
              >
                <PhoneOff size={18} />
                <span className="hidden sm:inline">Leave Session</span>
              </button>
            </div>
          </Tilt3DCard>
        </div>

        {/* Right Column: Synchronized AI Clinical Scribe Feed */}
        <div className="lg:col-span-4 flex flex-col">
          <Tilt3DCard className="flex-1 p-6 bg-slate-900/90 border-slate-800 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={16} /> AI Live Scribe & Notes
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Active Sync
                </span>
              </div>

              <div className="space-y-3">
                {liveTranscript.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                      msg.speaker.includes('AI')
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                        : msg.speaker.includes('Dr.')
                        ? 'bg-slate-950 border-slate-800 text-slate-200'
                        : 'bg-slate-900 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>{msg.speaker}</span>
                      <span className="font-mono">{msg.time}</span>
                    </div>
                    <p className="font-medium">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <FileText size={14} className="text-emerald-400" />
                  <span>Pending Prescription Draft</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Aspirin 81mg Oral • Metoprolol 25mg (Review required by clinician)
                </p>
              </div>

              <div className="text-[10px] font-mono text-slate-400 text-center">
                HIPAA / GDPR Compliant Consultation Record
              </div>
            </div>
          </Tilt3DCard>
        </div>
      </div>
    </div>
  );
};

export default TelehealthSimulator3D;
