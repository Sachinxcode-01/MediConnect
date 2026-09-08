import { z } from 'zod';

export enum UrgencyLevel {
  EMERGENT = 'EMERGENT',
  URGENT = 'URGENT',
  NON_URGENT = 'NON_URGENT',
  SELF_CARE = 'SELF_CARE',
}

export enum TriageStatus {
  PROCESSED = 'PROCESSED',
  REJECTED_NON_MEDICAL = 'REJECTED_NON_MEDICAL',
  REJECTED_MANIPULATION = 'REJECTED_MANIPULATION',
}

export const TriageResponseSchema = z.object({
  status: z.nativeEnum(TriageStatus),
  urgencyLevel: z.nativeEnum(UrgencyLevel).default(UrgencyLevel.NON_URGENT),
  recommendedSpecialty: z.string().default('General Physician'),
  redFlagsDetected: z.array(z.string()).default([]),
  clinicalRationale: z.string().default(''),
  suggestedDoctorQuestions: z.array(z.string()).default([]),
  disclaimer: z.string().min(20, 'Mandatory clinical disclaimer is required'),
});

export type TriageResponse = z.infer<typeof TriageResponseSchema>;

export const evaluateSymptomSchema = z.object({
  body: z.object({
    symptoms: z.string().trim().min(5, 'Symptoms must be at least 5 characters long').max(2000),
    patientAge: z.number().int().min(0).max(125).optional(),
    existingConditions: z.array(z.string()).optional(),
  }),
});

export type EvaluateSymptomDTO = z.infer<typeof evaluateSymptomSchema>;
