/**
 * WebRTC Signaling Client for Socket.io
 * Implements ICE Candidate Queuing to eliminate the classic 'InvalidStateError' race condition.
 */
import { createPeerConnectionConfig } from '../config/webrtc.config';

export class SignalingClient {
  constructor({ socket, roomId, localStream, onRemoteStream, onConnectionStateChange }) {
    this.socket = socket;
    this.roomId = roomId;
    this.localStream = localStream;
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;

    this.candidateQueue = [];
    this.remoteDescriptionSet = false;
    this.pc = null;

    this.initPeerConnection();
    this.setupSignalingListeners();
  }

  initPeerConnection() {
    const config = createPeerConnectionConfig();
    this.pc = new RTCPeerConnection(config);

    // Attach local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, this.localStream);
      });
    }

    // Handle incoming remote media tracks
    this.pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote stream track:', event.track.kind);
      if (this.onRemoteStream && event.streams[0]) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    // Emit local ICE candidates to peer via signaling
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('signal:candidate', {
          roomId: this.roomId,
          candidate: event.candidate,
        });
      }
    };

    // Monitor connection health & handle network drops
    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState;
      console.info(`[WebRTC] Connection state: ${state}`);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }

      if (state === 'failed') {
        this.handleIceRestart();
      }
    };
  }

  setupSignalingListeners() {
    // 1. Handle incoming WebRTC Offer
    this.socket.on('signal:offer', async ({ sdp }) => {
      try {
        console.log('[WebRTC] Handling incoming offer');
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        this.remoteDescriptionSet = true;
        await this.drainCandidateQueue();

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        this.socket.emit('signal:answer', {
          roomId: this.roomId,
          sdp: answer,
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    });

    // 2. Handle incoming WebRTC Answer
    this.socket.on('signal:answer', async ({ sdp }) => {
      try {
        console.log('[WebRTC] Handling incoming answer');
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        this.remoteDescriptionSet = true;
        await this.drainCandidateQueue();
      } catch (err) {
        console.error('[WebRTC] Error handling answer:', err);
      }
    });

    // 3. Handle incoming ICE candidates with queuing protection
    this.socket.on('signal:candidate', async ({ candidate }) => {
      try {
        if (!this.remoteDescriptionSet) {
          // Buffer candidate until setRemoteDescription completes
          this.candidateQueue.push(candidate);
        } else {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    });
  }

  async drainCandidateQueue() {
    while (this.candidateQueue.length > 0) {
      const candidate = this.candidateQueue.shift();
      if (candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[WebRTC] Buffered candidate error:', err);
        }
      }
    }
  }

  async initiateCall() {
    try {
      console.log('[WebRTC] Initiating call with offer...');
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await this.pc.setLocalDescription(offer);

      this.socket.emit('signal:offer', {
        roomId: this.roomId,
        sdp: offer,
      });
    } catch (err) {
      console.error('[WebRTC] Error initiating call:', err);
    }
  }

  async handleIceRestart() {
    console.warn('[WebRTC] Connection failed. Triggering ICE restart renegotiation...');
    try {
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
      this.socket.emit('signal:offer', {
        roomId: this.roomId,
        sdp: offer,
      });
    } catch (err) {
      console.error('[WebRTC] ICE restart failed:', err);
    }
  }

  destroy() {
    // Unsubscribe signaling listeners
    this.socket.off('signal:offer');
    this.socket.off('signal:answer');
    this.socket.off('signal:candidate');

    // Close peer connection and release tracks
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.candidateQueue = [];
    this.remoteDescriptionSet = false;
  }
}

export default SignalingClient;
