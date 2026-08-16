import { GeminiProvider } from './GeminiProvider.js';
import { OpenRouterProvider } from './OpenRouterProvider.js';
import { FallbackProvider } from './FallbackProvider.js';

class AIServiceOrchestrator {
  constructor() {
    this.providers = [
      new GeminiProvider(),
      new OpenRouterProvider(),
      new FallbackProvider()
    ];
  }

  async analyzeSymptoms(symptoms, vitalSigns = null) {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          return await provider.analyzeSymptoms(symptoms, vitalSigns);
        } catch (err) {
          console.warn(`[AIService] ${provider.name} failed. Attempting next provider... Error:`, err.message);
        }
      }
    }
    // Guaranteed fallback
    return new FallbackProvider().analyzeSymptoms(symptoms, vitalSigns);
  }

  async analyzeConsultation(chatHistory) {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          return await provider.analyzeConsultation(chatHistory);
        } catch (err) {
          console.warn(`[AIService] ${provider.name} failed for consultation. Attempting next provider...`);
        }
      }
    }
    return new FallbackProvider().analyzeConsultation(chatHistory);
  }

  async getAIChatResponse(messages) {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          return await provider.getAIChatResponse(messages);
        } catch (err) {
          console.warn(`[AIService] ${provider.name} failed for chat response. Attempting next provider...`);
        }
      }
    }
    return new FallbackProvider().getAIChatResponse(messages);
  }
}

export const aiService = new AIServiceOrchestrator();
export default aiService;
