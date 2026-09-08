import { z } from 'zod';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const uploadRecordSchema = z.object({
  body: z.object({
    patientId: z.string().min(5, 'Patient ID is required'),
    recordType: z
      .enum(['LAB_REPORT', 'PRESCRIPTION', 'CLINICAL_NOTE', 'IMAGING', 'VISIT_SUMMARY', 'Report', 'visit-summary'])
      .default('LAB_REPORT'),
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
    description: z.string().trim().max(3000).optional(),
    tags: z.array(z.string()).or(z.string().transform((val) => [val])).optional(),
  }),
  file: z
    .object({
      mimetype: z.enum(ALLOWED_MIME_TYPES, {
        errorMap: () => ({ message: 'Forbidden file type. Allowed: PDF, JPEG, PNG, WEBP' }),
      }),
      size: z.number().max(MAX_FILE_SIZE_BYTES, 'File size exceeds threshold of 15MB'),
    })
    .optional(),
});

export type UploadRecordDTO = z.infer<typeof uploadRecordSchema>;
