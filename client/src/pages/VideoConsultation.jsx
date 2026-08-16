import React, { useState, useEffect, useRef, useContext } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, User, ArrowLeft, Sparkles, Clipboard, Send, Bot, X, Monitor } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { 
  LiveKitRoom, 
  VideoConference, 
  AudioConference,
  ControlBar,
  RoomAudioRenderer,
  ParticipantTile,
  useTracks,
  formatChatMessageLinks
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

const VideoConsultation = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Room configuration
  const roomId = searchParams.get('roomId') || 'general-clinic';
  const [token, setToken] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  
  // AI Sidebar State
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  
  // Chat state (LiveKit handles its own but we can keep a local bridge if needed)
  const [messages, setMessages] = useState([
    { sender: 'System', text: 'LiveKit Encrypted Session Initialized.' }
  ]);

  // Fetch LiveKit Token on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data } = await api.get(`/api/video/token`, {
          params: {
            roomName: roomId,
            participantName: user.name || 'User ' + Math.floor(Math.random() * 1000)
          }
        });
        setToken(data.token);
      } catch (err) {
        console.error("Token fetch error:", err);
        toast.error("Failed to initialize video session");
      }
    };
    fetchToken();
  }, [roomId, user.name]);

  const handleBack = () => {
    navigate(user.role === 'patient' ? '/patient' : '/doctor');
  };

  const handleLeave = () => {
    setIsJoined(false);
    navigate(user.role === 'patient' ? '/patient' : '/doctor');
  };

  const handleGenerateAISummary = async () => {
     // For LiveKit, we'd ideally pull the chat history from their data channel
     // For now, let's assume we use the messages tracked in the local session
     const chatHistory = messages.filter(m => m.sender !== 'System').map(m => `${m.sender}: ${m.text}`).join('\n');
     if (!chatHistory) return toast.error("No conversation to analyze yet");

     setIsAnalyzing(true);
     try {
        const res = await api.post('/api/triage/analyze', {
           symptoms: chatHistory,
           severity: 'medium'
        });
        setAiNotes(res.data.analysis);
        toast.success("Clinical summary generated");
     } catch (e) {
        toast.error("AI Assistant failed");
     } finally {
        setIsAnalyzing(false);
     }
  };

  const handleSaveToLedger = async () => {
     if (!aiNotes) return toast.error("Generate notes first");
     const loadToast = toast.loading("Archiving clinical brief...");
     try {
        await api.post('/api/records/scribe', {
           patientId: roomId,
           consultationBrief: aiNotes
        });
        toast.success("Brief saved to Patient History", { id: loadToast });
     } catch (e) {
        toast.error("Failed to archive brief", { id: loadToast });
     }
  };

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  return (
    <div className="flex h-screen bg-themeLight font-geist flex-col overflow-hidden">
      <header className="bg-white border-b border-themeMedium/30 p-4 flex justify-between items-center shadow-sm relative z-20">
        <div className="flex items-center gap-6">
           <button onClick={handleBack} title="Exit Telehealth" className="p-2 hover:bg-themeSoft rounded-full transition-colors text-themeDeep group border border-transparent hover:border-themePrimary/30">
              <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
           </button>
           <h1 className="text-2xl font-black text-themeDeep flex items-center gap-2">
             <Video className="text-themePrimary" /> MediConnect Telehealth
           </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-themeDark bg-themeSoft px-4 py-1.5 rounded-full border border-themePrimary/30 shadow-sm flex items-center gap-2 text-xs">
            {isJoined ? <><div className="w-2 h-2 bg-themePrimary rounded-full shadow-neon"></div> Secure Session Active</> : 'Waiting for Token...'}
          </span>
          {user.role === 'doctor' && (
             <button 
                onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
                className={`p-2 rounded-full transition-all ${isAiSidebarOpen ? 'bg-themeDeep text-white' : 'bg-themeSoft text-themeDeep'}`}
             >
                <Bot size={20} />
             </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 flex gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col gap-6 h-full">
            {!isJoined ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-white p-12 rounded-[2.5rem] shadow-glass border border-themeMedium/30 text-center max-w-lg w-full transform hover:-translate-y-2 transition-all duration-500">
                    <div className="w-24 h-24 bg-themeSoft rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-white shadow-neon">
                      <Video className="w-10 h-10 text-themePrimary" />
                    </div>
                    <h2 className="text-3xl font-black text-themeDeep mb-2 uppercase tracking-tighter">Enter Consultation</h2>
                    <p className="text-themeDark/80 mb-6 font-medium">Powered by LiveKit Global Infrastructure. AES-256 Encrypted.</p>
                    
                    {/* Pre-Call Hardware Check */}
                    <div className="flex justify-center gap-4 mb-8">
                      <button
                        onClick={() => setMicEnabled(!micEnabled)}
                        className={`p-4 rounded-2xl font-bold flex items-center gap-2 transition-all border ${
                          micEnabled ? 'bg-themeSoft text-themePrimary border-themePrimary/30' : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                      >
                        {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                        <span className="text-xs">{micEnabled ? 'Mic Active' : 'Mic Muted'}</span>
                      </button>
                      <button
                        onClick={() => setCamEnabled(!camEnabled)}
                        className={`p-4 rounded-2xl font-bold flex items-center gap-2 transition-all border ${
                          camEnabled ? 'bg-themeSoft text-themePrimary border-themePrimary/30' : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                      >
                        {camEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                        <span className="text-xs">{camEnabled ? 'Camera Active' : 'Camera Off'}</span>
                      </button>
                    </div>

                    <button 
                      disabled={!token}
                      onClick={() => setIsJoined(true)} 
                      className="w-full py-4 bg-themePrimary text-white rounded-2xl font-black text-xl shadow-neon hover:shadow-neon-hover transform hover:-translate-y-1 transition-all duration-300 border-b-4 border-themeDark/30 active:border-0 disabled:opacity-50"
                    >
                      Join Secure Room
                    </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-themeDeep rounded-[3rem] overflow-hidden relative shadow-glass border-4 border-themePrimary/30 min-h-0">
                <LiveKitRoom
                  video={true}
                  audio={true}
                  token={token}
                  serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'wss://mediconnect-l0wy4o2c.livekit.cloud'}
                  onDisconnected={() => setIsJoined(false)}
                  className="h-full"
                >
                   <VideoConference />
                   <RoomAudioRenderer />
                </LiveKitRoom>
              </div>
            )}
        </div>

        {user.role === 'doctor' && isAiSidebarOpen && (
           <div className="w-96 bg-white rounded-[3rem] shadow-glass border border-themeMedium/30 flex flex-col p-8 overflow-hidden animate-slide-in">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-black text-themeDeep flex items-center gap-2 italic tracking-tight"><Sparkles className="text-themePrimary" size={20} /> AI Clinical Scribe</h3>
                    <p className="text-[9px] font-black text-themeDark/40 uppercase tracking-widest">Real-time Diagnostic Logic</p>
                 </div>
                 <button onClick={() => setIsAiSidebarOpen(false)} className="p-2 hover:bg-themeSoft rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 no-scrollbar mb-6">
                 {aiNotes ? (
                    <div className="prose prose-sm prose-slate max-w-none text-themeDeep font-bold">
                       <ReactMarkdown>{aiNotes}</ReactMarkdown>
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                       <Bot size={64} className="mb-4" />
                       <p className="text-xs font-black uppercase tracking-widest">Live transcription processing...</p>
                    </div>
                 )}
              </div>

              <div className="space-y-3">
                 <button 
                  onClick={handleGenerateAISummary}
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-themeDeep text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:shadow-3d transition-all disabled:opacity-50"
                 >
                    {isAnalyzing ? <><Sparkles className="animate-spin" size={14} /> Analyzing Feed...</> : <><Sparkles size={14} /> Generate Clinical Brief</>}
                 </button>
                 <button 
                  onClick={handleSaveToLedger}
                  disabled={!aiNotes || isAnalyzing}
                  className="w-full py-3 bg-themePrimary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:shadow-neon transition-all disabled:opacity-50"
                 >
                    <Send size={14} /> Save to Patient Record
                 </button>
                 <button 
                  onClick={() => {
                     navigator.clipboard.writeText(aiNotes);
                     toast.success("Notes copied to clipboard");
                  }}
                  disabled={!aiNotes}
                  className="w-full py-3 bg-themeSoft text-themeDeep rounded-2xl font-black uppercase text-[10px] tracking-widest border border-themePrimary/20 flex items-center justify-center gap-2 hover:bg-themeMedium transition-all disabled:opacity-50"
                 >
                    <Clipboard size={14} /> Copy to Clipboard
                 </button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default VideoConsultation;
