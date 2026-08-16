import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
  useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Mic, PhoneOff, Activity, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function AINurseCall({ roomName = 'triage-room' }) {
  const [token, setToken] = useState('');
  const [url, setUrl] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Generate token when connecting
    if (connecting) {
      api.post('/api/livekit/token', { roomName })
        .then(res => {
          setToken(res.data.token);
          setUrl(res.data.url);
        })
        .catch(err => {
          toast.error("Failed to connect to LiveKit server. Please configure keys.");
          setConnecting(false);
        });
    }
  }, [connecting, roomName]);

  const disconnect = () => {
    setConnecting(false);
    setToken('');
    setUrl('');
  };

  if (!connecting) {
    return (
      <div className="bg-themePrimary text-white rounded-2xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Activity /> Real-time AI Nurse</h3>
        <p className="text-white/80 mb-6 text-sm">Need immediate triage? Talk to our AI Medical Agent instantly using ultra-low latency voice tech.</p>
        <button
          onClick={() => setConnecting(true)}
          className="bg-white text-themePrimary px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-themeLight hover:text-themeDark transition-colors shadow-lg flex items-center justify-center gap-2 w-full"
        >
          <Mic size={18} /> Connect to AI Agent
        </button>
      </div>
    );
  }

  if (connecting && !token) {
    return (
      <div className="bg-themePrimary text-white rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-bold tracking-wide">Connecting to LiveKit servers...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      onDisconnected={disconnect}
      className="bg-themePrimary text-white rounded-2xl p-6 shadow-xl relative"
    >
      <AgentUI disconnect={disconnect} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function AgentUI({ disconnect }) {
  const { state, audioTrack } = useVoiceAssistant();
  const room = useRoomContext();

  // state can be 'disconnected', 'connecting', 'initializing', 'listening', 'thinking', 'speaking'

  return (
    <div className="flex flex-col items-center py-4">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${state === 'speaking' ? 'bg-white/20 scale-110' :
          state === 'listening' ? 'bg-green-400/20 shadow-[0_0_20px_rgba(74,222,128,0.4)]' :
            'bg-white/10'
        }`}>
        <Activity size={40} className={`${state === 'thinking' ? 'animate-pulse text-white/50' : 'text-white'}`} />
      </div>

      <h3 className="text-lg font-bold mb-1 uppercase tracking-widest text-center">
        {state === 'speaking' ? 'Agent Speaking...' :
          state === 'listening' ? 'Agent Listening...' :
            state === 'thinking' ? 'Agent Thinking...' :
              'Connecting Agent...'}
      </h3>

      <div className="h-16 w-full max-w-[200px] flex items-center justify-center mb-8">
        {audioTrack ? (
          <BarVisualizer
            state={state}
            barCount={5}
            trackRef={{ participant: audioTrack.participant, publishedTrack: audioTrack.publication, source: audioTrack.source }}
            className="w-full text-white"
            options={{ minHeight: 10 }}
          />
        ) : (
          <div className="text-white/50 text-sm">Waiting for audio track...</div>
        )}
      </div>

      <button
        onClick={() => room.disconnect()}
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-2"
      >
        <PhoneOff size={16} /> End Call
      </button>
    </div>
  );
}
