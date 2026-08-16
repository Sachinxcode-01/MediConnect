import aiService from '../integrations/ai/AIService.js';

export const analyzeSymptoms = async (symptoms, vitalSigns = null) => {
  return await aiService.analyzeSymptoms(symptoms, vitalSigns);
};

export const analyzeConsultation = async (chatHistory) => {
  return await aiService.analyzeConsultation(chatHistory);
};

export const getAIChatResponse = async (messages) => {
  return await aiService.getAIChatResponse(messages);
};

export default {
  analyzeSymptoms,
  analyzeConsultation,
  getAIChatResponse
};
