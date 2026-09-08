/**
 * Production WebRTC PeerConnection Configuration
 * Optimized for low-latency telemedicine consultations and traversal through strict hospital/corporate firewalls.
 */
export const createPeerConnectionConfig = (turnCredentials = null) => {
  const username = turnCredentials?.username || process.env.VITE_TURN_USERNAME || 'mediconnect-user';
  const credential = turnCredentials?.credential || process.env.VITE_TURN_CREDENTIAL || 'mediconnect-secret-key';

  return {
    iceServers: [
      // 1. Primary Public STUN servers
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },

      // 2. Production TURN Server over standard UDP (Port 3478)
      {
        urls: 'turn:turn.mediconnect.health:3478?transport=udp',
        username,
        credential,
      },

      // 3. Production TURN Server over TCP (Fallback for UDP-blocked networks)
      {
        urls: 'turn:turn.mediconnect.health:3478?transport=tcp',
        username,
        credential,
      },

      // 4. Secure TURNS over TLS (Port 5349 / 443 - Critical for strict clinical firewalls)
      {
        urls: 'turns:turn.mediconnect.health:5349?transport=tcp',
        username,
        credential,
      },
    ],
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all', // Seamlessly fallback from STUN peer-to-peer to relay TURN
    bundlePolicy: 'max-bundle', // Multiplex audio and video over a single ICE candidate pair
    rtcpMuxPolicy: 'require',
  };
};

export default createPeerConnectionConfig;
