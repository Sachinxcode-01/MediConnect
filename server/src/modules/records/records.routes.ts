import { Router } from 'express';
import { RecordsController } from './records.controller.js';
import { validateRequest } from '../../shared/middleware/validate.middleware.js';
import { uploadRecordSchema } from './dtos/create-record.dto.js';

export function createRecordsRouter(controller: RecordsController): Router {
  const router = Router();

  // Create new record with zero-trust Zod validation and ownership check
  router.post(
    '/',
    validateRequest(uploadRecordSchema, {
      requireAuth: true,
      checkPatientOwnership: true,
    }),
    controller.create
  );

  // Retrieve records for a specific patient
  router.get(
    '/patient/:patientId',
    validateRequest(
      // Minimal params check
      uploadRecordSchema.pick({ body: false as any }),
      { requireAuth: true, checkPatientOwnership: true }
    ),
    controller.getByPatient
  );

  // Retrieve single record by ID
  router.get('/:id', controller.getById);

  // Soft-delete record
  router.delete('/:id', controller.delete);

  return router;
}
