import supabase, { isSupabaseOnline } from '../config/supabase.js';

const localAuditLogs = [
  {
    id: 'log-001',
    actor_id: 'sys-admin',
    actor_role: 'admin',
    action: 'SYSTEM_BOOTSTRAP',
    target_id: 'platform',
    result: 'SUCCESS',
    ip_address: '127.0.0.1',
    created_at: new Date().toISOString()
  }
];

export class AuditLog {
  constructor(data) {
    this.id = data.id || data._id;
    this.actorId = data.actorId || data.actor_id;
    this.actorRole = data.actorRole || data.actor_role;
    this.action = data.action; // 'LOGIN' | 'VERIFY_DOCTOR' | 'CREATE_PRESCRIPTION' | 'ACCESS_RECORD' | 'MUTATE_APPOINTMENT'
    this.targetId = data.targetId || data.target_id;
    this.result = data.result || 'SUCCESS';
    this.ipAddress = data.ipAddress || data.ip_address || '127.0.0.1';
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
  }

  static async log(logData) {
    const payload = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actor_id: logData.actorId || logData.actor_id || 'system',
      actor_role: logData.actorRole || logData.actor_role || 'system',
      action: logData.action,
      target_id: logData.targetId || logData.target_id || null,
      result: logData.result || 'SUCCESS',
      ip_address: logData.ipAddress || logData.ip_address || '127.0.0.1',
      created_at: new Date().toISOString()
    };

    if (isSupabaseOnline()) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          return new AuditLog(data);
        }
      } catch {
        // Fall through
      }
    }

    localAuditLogs.unshift(payload);
    return new AuditLog(payload);
  }

  static async getRecentLogs(limit = 50) {
    if (isSupabaseOnline()) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data.map(l => new AuditLog(l));
        }
      } catch {
        // Fall through
      }
    }

    return localAuditLogs.slice(0, limit).map(l => new AuditLog(l));
  }
}

export default AuditLog;
