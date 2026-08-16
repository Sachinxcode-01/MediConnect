import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

// @desc    Get LiveKit Access Token
// @route   GET /api/video/token
// @access  Private
export const getToken = async (req, res, next) => {
  try {
    const { roomName, participantName } = req.query;

    if (!roomName || !participantName) {
      return res.status(400).json({ 
        success: false, 
        message: 'roomName and participantName are required' 
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ 
        success: false, 
        message: 'LiveKit credentials NOT configured on server' 
      });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    });

    at.addGrant({ 
      roomJoin: true, 
      room: roomName,
      canPublish: true,
      canSubscribe: true 
    });

    const token = await at.toJwt();

    res.status(200).json({ 
      success: true, 
      token 
    });
  } catch (error) {
    next(error);
  }
};
