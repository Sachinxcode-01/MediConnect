const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const supabase = require('../utils/supabase');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze-image', protect(['patient']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image provided.' });

        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are a world-class clinical diagnostic assistant. 
            Analyze the provided image (which could be a skin lesion, an eye, a throat, or lab results).
            
            1. Identify what is being shown.
            2. Provide a patient-friendly explanation of visible features.
            3. Suggest 2-3 potential medical categories it might fall into (NOT a final diagnosis).
            4. Provide urgency level (Low, Medium, High).
            5. ALWAYS include a prominent disclaimer: "This is AI-generated and NOT a substitute for professional medical advice. Please consult a doctor."

            Respond in structured JSON with fields: "title", "observations", "suggestions", "urgency", "disclaimer".
        `;

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        let text = response.text();
        
        // Remove markdown formatting if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        res.json(JSON.parse(text));
    } catch (e) {
        console.error('Vision AI Error:', e);
        res.status(500).json({ message: 'AI Vision analysis failed.', error: e.message });
    }
});

router.post('/predictive-risk', protect(['patient']), async (req, res) => {
    try {
        const { data: vitals, error } = await supabase
            .from('wearable_data')
            .select('*')
            .eq('user_id', req.user.id)
            .order('timestamp', { ascending: false })
            .limit(50);

        if (error) throw error;

        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Analyze the following patient biometric data (Heart Rate and SpO2 history):
            ${JSON.stringify(vitals)}

            1. Calculate a general "Vitality Score" (0-100).
            2. Identify any concerning trends or patterns.
            3. Provide 3 highly personalized "Bio-Hacks" to improve health.
            4. Predict risks for 2 conditions if current trends continue.

            Respond in JSON format: { "vitalityIndex": number, "observations": [], "bioHacks": [], "risks": [] }
        `;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        res.json(JSON.parse(text));
    } catch (e) {
        res.status(500).json({ message: 'Predictive analysis failed.', error: e.message });
    }
});

module.exports = router;
