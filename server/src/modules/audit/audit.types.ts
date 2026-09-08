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
  id: string;
  action: AuditAction;
  actorId: string;
  patientId?: string | null;
  targetResourceType: string;
  targetResourceId: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  timestamp: string | Date;
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
