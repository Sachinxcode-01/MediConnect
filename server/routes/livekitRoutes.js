const express = require('express');
const router = express.Router();
const { AccessToken } = require('livekit-server-sdk');
const { protect } = require('../middleware/auth');

router.post('/token', protect(['patient', 'doctor']), async (req, res) => {
  try {
    const { roomName } = req.body;
    
    // We assume the user has set these environment variables via LiveKit Cloud
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'LiveKit keys not configured on backend.' });
    }

    const participantIdentity = req.user.id;
    const participantName = req.user.name || 'User';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
    });

    at.addGrant({ roomJoin: true, room: roomName });

    const token = await at.toJwt();
    res.json({ token, url: process.env.LIVEKIT_URL });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;
