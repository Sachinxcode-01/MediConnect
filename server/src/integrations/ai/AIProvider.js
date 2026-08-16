/**
 * Abstract AI Provider Interface (TRD v2.0 Section 11)
 */
export class AIProvider {
  constructor(name = 'AbstractAIProvider') {
    this.name = name;
  }

  async analyzeSymptoms(symptoms, vitalSigns = null) {
    throw new Error(`analyzeSymptoms not implemented on ${this.name}`);
  }

  async analyzeConsultation(chatHistory) {
    throw new Error(`analyzeConsultation not implemented on ${this.name}`);
  }

  async getAIChatResponse(messages) {
    throw new Error(`getAIChatResponse not implemented on ${this.name}`);
  }
}
