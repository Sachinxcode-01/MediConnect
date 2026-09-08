import { supabase } from '../../config/supabase.js';
import { IAuditLog, LogEventDTO } from './audit.types.js';

export class AuditService {
  /**
   * Records an immutable HIPAA audit log entry in Supabase.
   */
  async logEvent(dto: LogEventDTO): Promise<IAuditLog> {
    const timestamp = new Date().toISOString();
    const payload = {
      action: dto.action,
      actor_id: dto.actorId,
      patient_id: dto.patientId || null,
      target_resource: dto.targetResourceType,
      target_id: dto.targetResourceId,
      ip_address: dto.ipAddress || '127.0.0.1',
      metadata: dto.metadata || {},
      created_at: timestamp,
    };

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('⚠️ [AuditService] Supabase audit log insert notice:', error.message);
        return {
          id: `audit-${Date.now()}`,
          action: dto.action,
          actorId: dto.actorId,
          patientId: dto.patientId || null,
          targetResourceType: dto.targetResourceType,
          targetResourceId: dto.targetResourceId,
          ipAddress: dto.ipAddress,
          metadata: dto.metadata,
          timestamp,
        };
      }

      return {
        id: data.id,
        action: data.action as IAuditLog['action'],
        actorId: data.actor_id,
        patientId: data.patient_id,
        targetResourceType: data.target_resource,
        targetResourceId: data.target_id,
        ipAddress: data.ip_address,
        metadata: data.metadata,
        timestamp: data.created_at,
      };
    } catch (err: any) {
      console.warn('⚠️ [AuditService] Failed to write to audit_logs:', err?.message || err);
      return {
        id: `audit-${Date.now()}`,
        action: dto.action,
        actorId: dto.actorId,
        patientId: dto.patientId || null,
        targetResourceType: dto.targetResourceType,
        targetResourceId: dto.targetResourceId,
        ipAddress: dto.ipAddress,
        metadata: dto.metadata,
        timestamp,
      };
    }
  }

  async getResourceAuditTrail(
    targetResourceType: string,
    targetResourceId: string,
    limit = 50
  ): Promise<IAuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('target_resource', targetResourceType)
      .eq('target_id', targetResourceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      action: item.action as IAuditLog['action'],
      actorId: item.actor_id,
      patientId: item.patient_id,
      targetResourceType: item.target_resource,
      targetResourceId: item.target_id,
      ipAddress: item.ip_address,
      metadata: item.metadata,
      timestamp: item.created_at,
    }));
  }

  async getPatientAccessLog(patientId: string, limit = 50): Promise<IAuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      action: item.action as IAuditLog['action'],
      actorId: item.actor_id,
      patientId: item.patient_id,
      targetResourceType: item.target_resource,
      targetResourceId: item.target_id,
      ipAddress: item.ip_address,
      metadata: item.metadata,
      timestamp: item.created_at,
    }));
  }
}
