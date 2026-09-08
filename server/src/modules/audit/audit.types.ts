import { Types } from 'mongoose';

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'TRIAGE_EVALUATION'
  | 'LOGIN'
  | 'LOGOUT';

export interface IAuditLog {
  _id: Types.ObjectId;
  action: AuditAction;
  actorId: Types.ObjectId;
  patientId?: Types.ObjectId;
  targetResourceType: string;
  targetResourceId: Types.ObjectId | string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface LogEventDTO {
  action: AuditAction;
  actorId: string;
  patientId?: string;
  targetResourceType: string;
  targetResourceId: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}
