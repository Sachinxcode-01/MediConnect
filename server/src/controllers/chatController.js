import { getAIChatResponse } from '../utils/aiService.js';

// @desc    Get AI Chat response
// @route   POST /api/chat
// @access  Private
export const getChatResponse = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Invalid messages format' });
    }

    const reply = await getAIChatResponse(messages);

    res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    next(error);
  }
};
