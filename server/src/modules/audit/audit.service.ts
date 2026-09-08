import { ClientSession, Types } from 'mongoose';
import { AuditLogModel } from './audit.model.js';
import { IAuditLog, LogEventDTO } from './audit.types.js';

export class AuditService {
  /**
   * Atomically records an audit log event.
   * If a ClientSession is provided, this record is committed only if the surrounding transaction succeeds.
   */
  async logEvent(dto: LogEventDTO, session?: ClientSession): Promise<IAuditLog> {
    const logData = {
      action: dto.action,
      actorId: new Types.ObjectId(dto.actorId),
      patientId: dto.patientId ? new Types.ObjectId(dto.patientId) : undefined,
      targetResourceType: dto.targetResourceType,
      targetResourceId: Types.ObjectId.isValid(dto.targetResourceId)
        ? new Types.ObjectId(dto.targetResourceId)
        : dto.targetResourceId,
      ipAddress: dto.ipAddress,
      metadata: dto.metadata || {},
      timestamp: new Date(),
    };

    const [createdLog] = await AuditLogModel.create([logData], { session });
    return createdLog;
  }

  async getResourceAuditTrail(
    targetResourceType: string,
    targetResourceId: string,
    limit = 50
  ): Promise<IAuditLog[]> {
    return AuditLogModel.find({
      targetResourceType,
      targetResourceId: Types.ObjectId.isValid(targetResourceId)
        ? new Types.ObjectId(targetResourceId)
        : targetResourceId,
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<IAuditLog[]>()
      .exec();
  }

  async getPatientAccessLog(patientId: string, limit = 50): Promise<IAuditLog[]> {
    return AuditLogModel.find({ patientId: new Types.ObjectId(patientId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<IAuditLog[]>()
      .exec();
  }
}
