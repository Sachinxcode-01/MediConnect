import axios from 'axios';
import { TRIAGE_SYSTEM_PROMPT, MANDATORY_DISCLAIMER } from './triage.prompt.js';
import {
  TriageResponse,
  TriageResponseSchema,
  TriageStatus,
  UrgencyLevel,
} from './triage.types.js';
import { env } from '../../config/env.js';

export class TriageService {
  private readonly apiKey = process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || '';
  private readonly model = process.env.OPENROUTER_MODEL || env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  async evaluateSymptoms(rawPatientInput: string): Promise<TriageResponse> {
    // 1. Sanitize user input delimiter tags to prevent prompt escaping
    const sanitizedInput = rawPatientInput.replace(/<\/?patient_input>/gi, '').trim();

    // 2. Fallback check if API key is not configured
    if (!this.apiKey || this.apiKey === 'your-openrouter-api-key') {
      console.warn('⚠️ [TriageService] OPENROUTER_API_KEY is not configured. Returning deterministic safety assessment.');
      return this.generateSafetyFallback(sanitizedInput);
    }

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.model,
          messages: [
            { role: 'system', content: TRIAGE_SYSTEM_PROMPT },
            { role: 'user', content: `<patient_input>${sanitizedInput}</patient_input>` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1, // Near deterministic evaluation
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://mediconnect.health',
            'X-Title': 'MediConnect Clinical Triage',
            'Content-Type': 'application/json',
          },
          timeout: 12000, // 12 seconds strict timeout
        }
      );

      const rawContent = response.data?.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error('Received empty response from OpenRouter');
      }

      // 3. Strict schema validation
      const parsedJson = JSON.parse(rawContent);
      return TriageResponseSchema.parse(parsedJson);
    } catch (err: any) {
      console.error('❌ [TriageService] OpenRouter evaluation error:', err?.response?.data || err?.message || err);
      return this.generateSafetyFallback(sanitizedInput);
    }
  }

  private generateSafetyFallback(input: string): TriageResponse {
    const isEmergent = /chest pain|breath|stroke|unconscious|bleeding heavily|heart attack/i.test(input);

    return {
      status: TriageStatus.PROCESSED,
      urgencyLevel: isEmergent ? UrgencyLevel.EMERGENT : UrgencyLevel.URGENT,
      recommendedSpecialty: isEmergent ? 'Emergency Medicine' : 'General Physician',
      redFlagsDetected: isEmergent ? ['Potential acute cardiopulmonary symptoms'] : [],
      clinicalRationale: 'Automated clinical safety fallback applied. Please consult a qualified practitioner.',
      suggestedDoctorQuestions: [
        'When did these symptoms first begin?',
        'Are symptoms worsening with physical activity?',
      ],
      disclaimer: MANDATORY_DISCLAIMER,
    };
  }
}
