import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const generateToken = async (req, res, next) => {
  try {
    const { roomName } = req.body;
    
    if (!roomName) {
      return res.status(400).json({ error: 'roomName is required' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'LiveKit keys not configured' });
    }

    const participantIdentity = req.user ? req.user.id : `user_${Math.floor(Math.random() * 10000)}`;
    const participantName = req.user ? req.user.name : 'Guest User';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
    });

    at.addGrant({ roomJoin: true, room: roomName });

    const token = await at.toJwt();
    
    res.status(200).json({ token, url: process.env.LIVEKIT_URL });
  } catch (error) {
    next(error);
  }
};
