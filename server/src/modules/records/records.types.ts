export enum RecordType {
  LAB_REPORT = 'LAB_REPORT',
  PRESCRIPTION = 'PRESCRIPTION',
  CLINICAL_NOTE = 'CLINICAL_NOTE',
  IMAGING = 'IMAGING',
  VISIT_SUMMARY = 'VISIT_SUMMARY',
}

export interface IMedicalRecord {
  id: string;
  patientId: string;
  doctorId?: string | null;
  type: RecordType | string;
  title: string;
  description?: string | null;
  fileUrl?: string;
  tags?: string[];
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  patient?: {
    id: string;
    user_id?: string;
    users?: { name: string; email: string };
  };
  doctor?: {
    id: string;
    user_id?: string;
    specialization?: string;
    users?: { name: string };
  };
}

export interface CreateRecordInput {
  patientId: string;
  doctorId?: string;
  recordType: RecordType | string;
  title: string;
  description?: string;
  fileUrl?: string;
  tags?: string[];
}

export interface RecordQueryOptions {
  patientId?: string;
  doctorId?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}
