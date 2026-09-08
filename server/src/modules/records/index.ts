import { RecordsRepository } from './records.repository.js';
import { RecordsService } from './records.service.js';
import { RecordsController } from './records.controller.js';
import { createRecordsRouter } from './records.routes.js';
import { auditService } from '../audit/index.js';

// Module internal dependency wiring
export const recordsRepository = new RecordsRepository();
export const recordsService = new RecordsService(recordsRepository, auditService);
export const recordsController = new RecordsController(recordsService);
export const recordsRouter = createRecordsRouter(recordsController);

// Re-export public types and services
export * from './records.types.js';
export * from './dtos/create-record.dto.js';
export { RecordsService } from './records.service.js';
export { RecordsRepository } from './records.repository.js';
