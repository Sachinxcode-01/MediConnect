import { Router } from 'express';
import { TriageController } from './triage.controller.js';
import { triageRateLimiter } from '../../shared/middleware/triageRateLimiter.js';
import { validateRequest } from '../../shared/middleware/validate.middleware.js';
import { evaluateSymptomSchema } from './triage.types.js';

export function createTriageRouter(controller: TriageController): Router {
  const router = Router();

  // Protect AI endpoint with Redis sliding-window limiter and Zod schema
  router.post(
    '/',
    triageRateLimiter,
    validateRequest(evaluateSymptomSchema),
    controller.evaluate
  );

  router.post(
    '/evaluate',
    triageRateLimiter,
    validateRequest(evaluateSymptomSchema),
    controller.evaluate
  );

  return router;
}
