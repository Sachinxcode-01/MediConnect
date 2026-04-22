import React, { useState, useEffect, useRef, useContext } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, User, ArrowLeft, Sparkles, Clipboard, Send, Bot, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const VideoConsultation = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId') || 'standard-session';
  const [isJoined, setIsJoined] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  
  const handleBack = () => {
    if (isJoined) {
       handleLeave();
    } else {
       navigate(user.role === 'patient' ? '/patient' : '/doctor');
    }
  };

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  
  const [messages, setMessages] = useState([
    { sender: 'System', text: 'Encrypted WebRTC Session Started.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // AI Scribe State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const socketRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();
  const targetIdRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
    socketRef.current.on('user-connected', (id) => {
       targetIdRef.current = id;
       setRemoteUser(true);
       createOffer(id);
    });

    socketRef.current.on('chat-message', (msg) => {
       setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on('user-disconnected', () => {
       setRemoteUser(false);
       if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    });

    socketRef.current.on('offer', handleReceiveOffer);
    socketRef.current.on('answer', handleReceiveAnswer);
    socketRef.current.on('ice-candidate', handleNewICECandidateMsg);

    return () => {
      socketRef.current.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
    };
  }, []);

  const [remoteUser, setRemoteUser] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const msg = { sender: user.name, text: chatInput };
    socketRef.current.emit('chat-message', { roomId, message: msg });
    setMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  const createPeer = () => {
     const peer = new RTCPeerConnection({
       iceServers: [{ urls: "stun:stun.stunprotocol.org" }]
     });
     
     peer.onicecandidate = (e) => {
        if (e.candidate && targetIdRef.current) {
           socketRef.current.emit('ice-candidate', {
              target: targetIdRef.current,
              candidate: e.candidate 
           });
        }
     };

     peer.ontrack = (e) => {
        if (remoteVideoRef.current) {
           remoteVideoRef.current.srcObject = e.streams[0];
           setRemoteUser(true);
        }
     };
     
     if (localStreamRef.current) {
       localStreamRef.current.getTracks().forEach(track => {
         peer.addTrack(track, localStreamRef.current);
       });
     }

     return peer;
  };

  const createOffer = async (target) => {
      peerRef.current = createPeer();
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current.emit('offer', { target, caller: socketRef.current.id, sdp: offer });
  };

  const handleReceiveOffer = async (incoming) => {
      targetIdRef.current = incoming.caller;
      peerRef.current = createPeer();
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit('answer', { target: incoming.caller, sdp: answer });
  };

  const handleReceiveAnswer = async (incoming) => {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
  };

  const handleNewICECandidateMsg = async (candidate) => {
     if (peerRef.current) {
       await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
     }
  };

  const handleJoin = async () => {
    try {
       const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
       localStreamRef.current = stream;
       if (localVideoRef.current) localVideoRef.current.srcObject = stream;
       
       socketRef.current.emit('join-room', roomId);
       setIsJoined(true);
    } catch (e) {
       toast.error("Camera/Mic access required");
    }
  };

  const handleLeave = () => {
    setIsJoined(false);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    socketRef.current.emit('disconnect');
    navigate(user.role === 'patient' ? '/patient' : '/doctor');
  };

  const handleGenerateAISummary = async () => {
     const chatHistory = messages.filter(m => m.sender !== 'System').map(m => `${m.sender}: ${m.text}`).join('\n');
     if (!chatHistory) return toast.error("No conversation to analyze yet");

     setIsAnalyzing(true);
     try {
        const res = await api.post('/api/triage/analyze', {
           symptoms: chatHistory,
           severity: 'medium' // placeholder
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
     if (roomId === 'standard-session') return toast.error("Cannot save to global session");

     const loadToast = toast.loading("Archiving clinical brief...");
     try {
        await api.post('/api/records/scribe', {
           patientId: roomId,
           consultationBrief: aiNotes
        });
        toast.success("Brief saved to Patient History", { id: loadToast });
     } catch (e) {
        console.error("Save Error:", e);
        toast.error("Failed to archive brief", { id: loadToast });
     }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
       localStreamRef.current.getAudioTracks()[0].enabled = !micOn;
       setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
       localStreamRef.current.getVideoTracks()[0].enabled = !camOn;
       setCamOn(!camOn);
    }
  };

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
            {isJoined ? <><div className="w-2 h-2 bg-themePrimary rounded-full shadow-neon"></div> Secure Session Active</> : 'Waiting to join...'}
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
                    <h2 className="text-3xl font-black text-themeDeep mb-4 uppercase tracking-tighter">Enter Consultation</h2>
                    <p className="text-themeDark/80 mb-8 font-medium">Your connection runs on fully encrypted peer-to-peer WebRTC technology.</p>
                    <button 
                    onClick={handleJoin} 
                    className="w-full py-4 bg-themePrimary text-white rounded-2xl font-black text-xl shadow-neon hover:shadow-neon-hover transform hover:-translate-y-1 transition-all duration-300 border-b-4 border-themeDark/30 active:border-0"
                    >
                    Join Now
                    </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-themeDeep rounded-[3rem] overflow-hidden relative shadow-glass border-4 border-themePrimary/30 min-h-0">
                <video ref={remoteVideoRef} className="absolute inset-0 w-full h-full object-cover bg-black" autoPlay playsInline />
                {!remoteUser && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-themeDeep/40 backdrop-blur-sm">
                    <User className="w-32 h-32 text-white/20 mb-4 animate-pulse-slow" />
                    <p className="text-white font-black tracking-widest bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 uppercase text-[10px]">Waiting for Participant Joining...</p>
                    </div>
                )}
                <div className="absolute top-6 right-6 w-48 h-64 bg-black rounded-[2rem] overflow-hidden border-2 border-themePrimary shadow-glass z-10 hidden md:block">
                    <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
                </div>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/20 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-glass z-20">
                    <button onClick={toggleMic} className={`p-4 rounded-full transition-all ${micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white shadow-neon'}`}>{micOn ? <Mic /> : <MicOff />}</button>
                    <button onClick={handleLeave} className="p-5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-neon transform hover:-translate-y-1 transition-all"><PhoneOff size={28} /></button>
                    <button onClick={toggleCam} className={`p-4 rounded-full transition-all ${camOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white shadow-neon'}`}>{camOn ? <Video /> : <VideoOff />}</button>
                </div>
              </div>
            )}
            
            {isJoined && (
               <div className="bg-white rounded-[2rem] shadow-glass border border-themeMedium/30 flex flex-col p-4 h-64 min-h-[16rem]">
                  <div className="flex justify-between items-center mb-2 px-2">
                     <h3 className="text-sm font-black text-themeDeep uppercase tracking-widest italic">Live Session Communications</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto mb-3 flex flex-col gap-3 px-2 no-scrollbar">
                    {messages.map((m, i) => (
                      <div key={i} className={`p-3 rounded-2xl text-xs font-bold border border-themeMedium/20 max-w-[80%] ${m.sender === user.name ? 'bg-themeSoft text-themeDeep self-end rounded-tr-sm' : 'bg-gray-50 self-start rounded-tl-sm'}`}>
                        <span className="block text-[8px] opacity-40 uppercase font-black mb-1">{m.sender}</span>
                        {m.text}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type clinical note or chat message..." className="flex-1 bg-themeLight border-2 border-themeMedium/20 rounded-xl px-5 text-xs font-black focus:outline-none focus:border-themePrimary" />
                    <button type="submit" className="bg-themeDeep text-white px-6 rounded-xl hover:shadow-neon transition-all font-black uppercase text-[10px] tracking-widest"><Send size={14} /></button>
                  </form>
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
                       <p className="text-xs font-black uppercase tracking-widest">Awaiting interaction data...</p>
                    </div>
                 )}
              </div>

              <div className="space-y-3">
                 <button 
                  onClick={handleGenerateAISummary}
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-themeDeep text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:shadow-3d transition-all disabled:opacity-50"
                 >
                    {isAnalyzing ? <><Sparkles className="animate-spin" size={14} /> Synthesizing...</> : <><Sparkles size={14} /> Generate Clinical Brief</>}
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
