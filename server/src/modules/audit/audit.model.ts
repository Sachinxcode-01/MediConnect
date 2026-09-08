import { Schema, model, Document } from 'mongoose';
import { IAuditLog } from './audit.types.js';

export interface AuditLogDocument extends IAuditLog, Document {}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetResourceType: {
      type: String,
      required: true,
      index: true,
    },
    targetResourceId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound indexes for compliance inquiries and fast auditing
AuditLogSchema.index({ targetResourceType: 1, targetResourceId: 1, timestamp: -1 });
AuditLogSchema.index({ patientId: 1, timestamp: -1 });
AuditLogSchema.index({ actorId: 1, timestamp: -1 });

export const AuditLogModel = model<AuditLogDocument>('AuditLog', AuditLogSchema);
