import { RecordsRepository } from './records.repository.js';
import { AuditService } from '../audit/index.js';
import { IMedicalRecord, CreateRecordInput, RecordQueryOptions } from './records.types.js';

export class RecordsService {
  constructor(
    private readonly recordsRepo: RecordsRepository,
    private readonly auditService: AuditService
  ) {}

  async createRecord(
    input: CreateRecordInput,
    actorId: string,
    ipAddress?: string
  ): Promise<IMedicalRecord> {
    // 1. Create the Medical Record in repository
    const record = await this.recordsRepo.create(input);

    // 2. Dispatch HIPAA Audit Log entry
    await this.auditService.logEvent({
      action: 'CREATE',
      actorId,
      patientId: input.patientId,
      targetResourceType: 'MedicalRecord',
      targetResourceId: record.id,
      ipAddress,
      metadata: {
        type: record.type,
        title: record.title,
        hasFile: Boolean(record.fileUrl),
      },
    });

    return record;
  }

  async getPatientRecords(
    patientId: string,
    actorId: string,
    options: RecordQueryOptions = {},
    ipAddress?: string
  ): Promise<IMedicalRecord[]> {
    const records = await this.recordsRepo.findByPatient(patientId, options);

    // HIPAA Audit for PHI (Protected Health Information) access
    await this.auditService.logEvent({
      action: 'READ',
      actorId,
      patientId,
      targetResourceType: 'MedicalRecord',
      targetResourceId: `batch-patient-${patientId}`,
      ipAddress,
      metadata: { count: records.length },
    });

    return records;
  }

  async getRecordById(id: string, actorId: string, ipAddress?: string): Promise<IMedicalRecord | null> {
    const record = await this.recordsRepo.findById(id);
    if (!record) return null;

    await this.auditService.logEvent({
      action: 'READ',
      actorId,
      patientId: record.patientId,
      targetResourceType: 'MedicalRecord',
      targetResourceId: record.id,
      ipAddress,
    });

    return record;
  }

  async softDeleteRecord(id: string, actorId: string, ipAddress?: string): Promise<boolean> {
    const record = await this.recordsRepo.findById(id);
    if (!record) return false;

    const success = await this.recordsRepo.softDelete(id);

    if (success) {
      await this.auditService.logEvent({
        action: 'DELETE',
        actorId,
        patientId: record.patientId,
        targetResourceType: 'MedicalRecord',
        targetResourceId: id,
        ipAddress,
        metadata: { softDeleted: true },
      });
    }

    return success;
  }
}
