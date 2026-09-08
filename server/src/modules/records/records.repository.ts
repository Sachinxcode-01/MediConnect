import { supabase } from '../../config/supabase.js';
import { IMedicalRecord, CreateRecordInput, RecordQueryOptions } from './records.types.js';

export class RecordsRepository {
  private mapRowToRecord(row: any): IMedicalRecord {
    return {
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      type: row.type,
      title: row.title,
      description: row.description,
      fileUrl: row.file_url || '',
      tags: row.tags || [],
      isDeleted: Boolean(row.is_deleted),
      deletedAt: row.deleted_at || null,
      createdAt: row.created_at || new Date().toISOString(),
      patient: row.patient,
      doctor: row.doctor,
    };
  }

  async create(input: CreateRecordInput): Promise<IMedicalRecord> {
    const row = {
      patient_id: input.patientId,
      doctor_id: input.doctorId || null,
      type: input.recordType,
      title: input.title,
      description: input.description || null,
      file_url: input.fileUrl || '',
      tags: input.tags || [],
      date: new Date().toISOString().split('T')[0],
      is_deleted: false,
      deleted_at: null,
    };

    const { data, error } = await supabase
      .from('medical_records')
      .insert(row)
      .select()
      .single();

    if (error) {
      // If error is due to column is_deleted not existing yet in SQL schema, retry without it
      if (error.message.includes('is_deleted')) {
        delete (row as any).is_deleted;
        delete (row as any).deleted_at;
        const retryRes = await supabase.from('medical_records').insert(row).select().single();
        if (retryRes.error) throw retryRes.error;
        return this.mapRowToRecord(retryRes.data);
      }
      throw error;
    }

    return this.mapRowToRecord(data);
  }

  async findById(id: string): Promise<IMedicalRecord | null> {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`*, patient:patients!patient_id(id, user_id, users!user_id(name, email)), doctor:doctors!doctor_id(id, user_id, specialization, users!user_id(name))`)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    if (data.is_deleted) return null; // Enforce soft-delete filter

    return this.mapRowToRecord(data);
  }

  async findByPatient(patientId: string, options: RecordQueryOptions = {}): Promise<IMedicalRecord[]> {
    let query = supabase
      .from('medical_records')
      .select(`*, patient:patients!patient_id(id, user_id, users!user_id(name, email)), doctor:doctors!doctor_id(id, user_id, specialization, users!user_id(name))`)
      .eq('patient_id', patientId);

    if (!options.includeDeleted) {
      query = query.or('is_deleted.is.null,is_deleted.eq.false');
    }

    query = query
      .order('created_at', { ascending: false })
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

    const { data, error } = await query;
    if (error) {
      // If is_deleted filtering fails because column is missing in legacy table, fallback query
      if (error.message.includes('is_deleted')) {
        const fallback = await supabase
          .from('medical_records')
          .select(`*, patient:patients!patient_id(id, user_id, users!user_id(name, email)), doctor:doctors!doctor_id(id, user_id, specialization, users!user_id(name))`)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });
        if (fallback.error) throw fallback.error;
        return (fallback.data || []).map((r) => this.mapRowToRecord(r));
      }
      throw error;
    }

    return (data || []).map((r) => this.mapRowToRecord(r));
  }

  async softDelete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('medical_records')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      // Fallback to hard delete if soft delete column is not present
      if (error.message.includes('is_deleted')) {
        const delRes = await supabase.from('medical_records').delete().eq('id', id);
        return !delRes.error;
      }
      throw error;
    }

    return true;
  }
}
