import { TriageService } from './triage.service.js';
import { TriageController } from './triage.controller.js';
import { createTriageRouter } from './triage.routes.js';
import { auditService } from '../audit/index.js';

export const triageService = new TriageService();
export const triageController = new TriageController(triageService, auditService);
export const triageRouter = createTriageRouter(triageController);

export * from './triage.types.js';
export * from './triage.prompt.js';
export { TriageService } from './triage.service.js';
