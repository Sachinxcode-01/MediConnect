import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './AIProvider.js';

const RED_FLAG_KEYWORDS = [
  'chest pain', 'heart attack', 'shortness of breath', 'difficulty breathing',
  'sudden numbness', 'facial drooping', 'arm weakness', 'slurred speech',
  'stroke', 'severe bleeding', 'unconscious', 'loss of consciousness',
  'severe head trauma', 'sudden vision loss', 'coughing blood', 'anaphylaxis'
];

export class GeminiProvider extends AIProvider {
  constructor() {
    super('GeminiProvider');
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your-gemini-api-key') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  isAvailable() {
    return Boolean(this.genAI);
  }

  checkEmergencyRedFlags(symptomsText = '') {
    const lower = symptomsText.toLowerCase();
    return RED_FLAG_KEYWORDS.filter(k => lower.includes(k));
  }

  async analyzeSymptoms(symptoms, vitalSigns = null) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key is not configured');
    }

    const detectedRedFlags = this.checkEmergencyRedFlags(symptoms);
    const modelName = 'gemini-2.0-flash';
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are MediConnect's AI Triage & Clinical Decision Support Assistant.
      Analyze the patient symptoms and optional vitals.

      Patient Symptoms: "${symptoms}"
      ${vitalSigns ? `Patient Vitals: ${JSON.stringify(vitalSigns)}` : ''}

      Return a strict JSON object with this EXACT structure:
      {
        "severity": "low" | "medium" | "high" | "critical",
        "urgency": "emergency" | "urgent" | "routine" | "self_care",
        "symptoms_detected": ["symptom 1", "symptom 2"],
        "possible_categories": ["Category 1"],
        "recommended_next_step": "Clear recommendation",
        "red_flags": [],
        "confidence": 0.85,
        "disclaimer": "This assessment is for informational support only and does not replace professional medical diagnosis."
      }
    `;

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    let parsed = JSON.parse(text);

    if (detectedRedFlags.length > 0) {
      parsed.severity = 'critical';
      parsed.urgency = 'emergency';
      parsed.red_flags = Array.from(new Set([...(parsed.red_flags || []), ...detectedRedFlags.map(f => `Emergency flag: ${f}`)]));
      parsed.recommended_next_step = 'SEEK IMMEDIATE EMERGENCY MEDICAL CARE (Call 911 / Visit Nearest ER)';
    }

    parsed.model_info = { provider: this.name, model: modelName, timestamp: new Date().toISOString() };
    return parsed;
  }

  async analyzeConsultation(chatHistory) {
    if (!this.isAvailable()) throw new Error('Gemini API key is not configured');
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      You are an expert clinical scribe. Analyze the consultation chat history and generate a professional clinical brief in Markdown.
      Chat History:
      ${chatHistory}
    `;
    const result = await model.generateContent(prompt);
    return (await result.response).text();
  }

  async getAIChatResponse(messages) {
    if (!this.isAvailable()) throw new Error('Gemini API key is not configured');
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    });
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    return (await result.response).text();
  }
}
