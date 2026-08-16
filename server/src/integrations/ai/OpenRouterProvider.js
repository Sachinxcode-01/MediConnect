import OpenAI from 'openai';
import { AIProvider } from './AIProvider.js';

export class OpenRouterProvider extends AIProvider {
  constructor() {
    super('OpenRouterProvider');
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey && apiKey !== 'your-openrouter-api-key') {
      this.client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
        defaultHeaders: {
          'HTTP-Referer': 'https://mediconnect.ai',
          'X-Title': 'MediConnect'
        }
      });
    }
  }

  isAvailable() {
    return Boolean(this.client);
  }

  async analyzeSymptoms(symptoms, vitalSigns = null) {
    if (!this.isAvailable()) throw new Error('OpenRouter API key not configured');

    const response = await this.client.chat.completions.create({
      model: 'meta-llama/llama-3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are MediConnect AI Triage. Return strict JSON with fields: severity, urgency, symptoms_detected, possible_categories, recommended_next_step, red_flags, confidence, disclaimer.'
        },
        { role: 'user', content: `Symptoms: ${symptoms}` }
      ],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    parsed.model_info = { provider: this.name, model: 'llama-3-70b-instruct', timestamp: new Date().toISOString() };
    return parsed;
  }

  async analyzeConsultation(chatHistory) {
    if (!this.isAvailable()) throw new Error('OpenRouter API key not configured');
    const response = await this.client.chat.completions.create({
      model: 'meta-llama/llama-3-70b-instruct',
      messages: [
        { role: 'system', content: 'Generate a clinical brief in Markdown.' },
        { role: 'user', content: chatHistory }
      ]
    });
    return response.choices[0].message.content;
  }

  async getAIChatResponse(messages) {
    if (!this.isAvailable()) throw new Error('OpenRouter API key not configured');
    const response = await this.client.chat.completions.create({
      model: 'meta-llama/llama-3-70b-instruct',
      messages: messages
    });
    return response.choices[0].message.content;
  }
}
