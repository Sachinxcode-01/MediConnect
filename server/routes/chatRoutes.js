const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/', protect(['patient']), async (req, res) => {
  try {
    const { messages } = req.body; // Expect an array of conversation history
    
    // Convert to a single prompt block or pass structured conversation
    let promptText = "You are MediConnect AI, a helpful, empathetic, and knowledgeable healthcare assistant. Answer general health questions and assist the patient. Always remind them you are an AI and they should consult a real doctor for serious issues.\n\n";
    messages.forEach(m => {
        promptText += `${m.role === 'user' ? 'Patient' : 'AI'}: ${m.content}\n`;
    });
    promptText += "AI:";

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: promptText
    });
    const aiResponseText = result.text || "I'm experiencing a bit of brain fog, could you repeat that?";
    
    res.json({ reply: aiResponseText });
  } catch (error) {
    console.error("Gemini Chatbot Error:", error);
    res.status(500).json({ message: "Failed to connect to AI Chatbot. Please check Gemini API config.", error: error.message });
  }
});

module.exports = router;
