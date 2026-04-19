import React, { useState, useEffect, useRef, useContext } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, User, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const VideoConsultation = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);
  
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
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const socketRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();
  const targetIdRef = useRef(null); // The other person in the room

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
    socketRef.current.on('user-connected', (id) => {
       console.log('User connected', id);
       // We are the caller since they just joined
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
    socketRef.current.emit('chat-message', { roomId: 'telehealth-room-1', message: msg });
    setMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  const createPeer = () => {
     const peer = new RTCPeerConnection({
       iceServers: [
         { urls: "stun:stun.stunprotocol.org" }
       ]
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
       
       socketRef.current.emit('join-room', 'telehealth-room-1');
       setIsJoined(true);
    } catch (e) {
       alert("Camera/Mic access required");
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
    window.location.href = user.role === 'patient' ? '/patient' : '/doctor';
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
    <div className="flex h-screen bg-themeLight font-geist flex-col">
      <header className="bg-white border-b border-themeMedium/30 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
           <button onClick={handleBack} title="Exit Telehealth" className="p-2 hover:bg-themeSoft rounded-full transition-colors text-themeDeep group border border-transparent hover:border-themePrimary/30">
              <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
           </button>
           <h1 className="text-2xl font-black text-themeDeep flex items-center gap-2">
             <Video className="text-themePrimary" /> MediConnect Telehealth
           </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-themeDark bg-themeSoft px-4 py-1.5 rounded-full border border-themePrimary/30 shadow-sm flex items-center gap-2">
            {isJoined ? <><div className="w-2 h-2 bg-themePrimary rounded-full shadow-neon"></div> Secure WebRTC Connected</> : 'Waiting to join...'}
          </span>
        </div>
      </header>

      <main className="flex-1 p-8 flex justify-center items-center overflow-hidden">
        {!isJoined ? (
          <div className="bg-white p-12 rounded-3xl shadow-glass border border-themeMedium/30 text-center max-w-lg w-full transform hover:-translate-y-2 transition-all duration-500">
            <div className="w-24 h-24 bg-themeSoft rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-white shadow-neon">
              <Video className="w-10 h-10 text-themePrimary" />
            </div>
            <h2 className="text-3xl font-black text-themeDeep mb-4">Ready to join?</h2>
            <p className="text-themeDark/80 mb-8 font-medium">Your connection runs on fully encrypted peer-to-peer WebRTC technology. Please allow camera and microphone access.</p>
            <button 
              onClick={handleJoin} 
              className="w-full py-4 bg-themePrimary text-white rounded-xl font-black text-xl shadow-neon hover:shadow-neon-hover transform hover:-translate-y-1 transition-all duration-300 border-b-4 border-themeDark/30 active:border-0"
            >
              Join Consultation
            </button>
          </div>
        ) : (
          <div className="w-full max-w-6xl h-full flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-themeDeep rounded-3xl overflow-hidden relative shadow-glass border-4 border-themePrimary/30">
              
              <video 
                ref={remoteVideoRef} 
                className="absolute inset-0 w-full h-full object-cover bg-black" 
                autoPlay 
                playsInline
              />
              
              {!remoteUser && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-themeDeep">
                  <User className="w-32 h-32 text-white/20 mb-4 animate-pulse-slow" />
                  <p className="text-white font-bold tracking-widest bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">Waiting for other party to join...</p>
                </div>
              )}
              
              <div className="absolute top-6 right-6 w-48 h-64 bg-black rounded-2xl overflow-hidden border-2 border-themePrimary shadow-glass z-10 hidden md:block">
                 <video 
                   ref={localVideoRef} 
                   className="w-full h-full object-cover mirror" 
                   autoPlay 
                   playsInline 
                   muted 
                   style={{ transform: 'scaleX(-1)' }} 
                 />
              </div>

              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/20 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-glass z-20">
                <button 
                  onClick={toggleMic} 
                  className={`p-4 rounded-full transition-all ${micOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white shadow-neon'}`}
                >
                  {micOn ? <Mic /> : <MicOff />}
                </button>
                <button 
                  onClick={handleLeave} 
                  className="p-5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-neon transform hover:-translate-y-1 transition-all"
                >
                  <PhoneOff size={28} />
                </button>
                <button 
                  onClick={toggleCam} 
                  className={`p-4 rounded-full transition-all ${camOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white shadow-neon'}`}
                >
                  {camOn ? <Video /> : <VideoOff />}
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-80 bg-white rounded-3xl shadow-glass border border-themeMedium/30 flex flex-col p-6">
              <h3 className="text-xl font-black text-themeDeep mb-4 border-b border-themeMedium/30 pb-4">Live Chat</h3>
              <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-4" id="video-chat-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`p-3 rounded-2xl text-sm font-medium border border-themeMedium/30 ${m.sender === user.name ? 'bg-themeSoft self-end rounded-tr-sm' : 'bg-gray-50 self-start rounded-tl-sm'}`}>
                    <span className="block text-[10px] opacity-50 uppercase font-black mb-1">{m.sender}</span>
                    {m.text}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-themeLight border border-themeMedium/50 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-themePrimary" 
                />
                <button type="submit" className="bg-themePrimary text-white p-3 rounded-xl hover:shadow-neon transition-all">Send</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoConsultation;
