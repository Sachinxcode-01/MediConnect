import supabase, { isSupabaseOnline } from '../config/supabase.js';
import { localStore } from './localStore.js';

class MedicalRecord {
  constructor(data) {
    this._id = data.id || data._id;
    this.id = data.id || data._id;
    this.patient = data.patient_id || data.patient;
    this.patientId = data.patient_id || data.patient;
    this.doctor = data.doctor_id || data.doctor;
    this.doctorId = data.doctor_id || data.doctor;
    this.type = data.type || 'Report';
    this.title = data.title;
    this.description = data.description || '';
    this.fileUrl = data.file_url || data.fileUrl || '';
    this.fileName = data.file_name || data.fileName || 'record.pdf';
    this.fileSize = data.file_size || data.fileSize || 0;
    this.hash = data.hash || '';
    this.tags = data.tags || [];
    this.visitDate = data.date || data.visitDate || new Date().toISOString().split('T')[0];
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
  }

  static async create(data) {
    const newId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const row = {
      id: newId,
      _id: newId,
      patient_id: data.patient || data.patientId,
      doctor_id: data.doctor || data.doctorId,
      type: data.type || 'Report',
      title: data.title,
      description: data.description || '',
      file_url: data.fileUrl || '',
      file_name: data.fileName || 'record.pdf',
      file_size: data.fileSize || 0,
      hash: data.hash || '',
      tags: data.tags || [],
      date: data.visitDate ? new Date(data.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    if (isSupabaseOnline()) {
      try {
        const { data: inserted, error } = await supabase
          .from('medical_records')
          .insert(row)
          .select()
          .single();

        if (!error && inserted) {
          return new MedicalRecord(inserted);
        }
      } catch {
        // Fall through
      }
    }

    localStore.medicalRecords.unshift(row);
    return new MedicalRecord(row);
  }

  static async find(query = {}) {
    if (isSupabaseOnline()) {
      try {
        let q = supabase.from('medical_records').select('*');
        if (query.patient) q = q.eq('patient_id', query.patient);
        if (query.doctor) q = q.eq('doctor_id', query.doctor);
        q = q.order('created_at', { ascending: false }).limit(query.limit || 100);

        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(r => new MedicalRecord(r));
        }
      } catch {
        // Fall through
      }
    }

    let results = localStore.medicalRecords;
    if (query.patient) {
      results = results.filter(r => r.patient_id === query.patient || r.patient === query.patient);
    }
    if (query.doctor) {
      results = results.filter(r => r.doctor_id === query.doctor || r.doctor === query.doctor);
    }

    return results.map(r => new MedicalRecord(r));
  }

  static async findById(id) {
    if (isSupabaseOnline()) {
      try {
        const { data, error } = await supabase
          .from('medical_records')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) return new MedicalRecord(data);
      } catch {
        // Fall through
      }
    }

    const found = localStore.medicalRecords.find(r => r.id === id || r._id === id);
    return found ? new MedicalRecord(found) : null;
  }

  static async findByIdAndUpdate(id, updates) {
    if (isSupabaseOnline()) {
      try {
        const { data, error } = await supabase
          .from('medical_records')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) return new MedicalRecord(data);
      } catch {
        // Fall through
      }
    }

    const index = localStore.medicalRecords.findIndex(r => r.id === id || r._id === id);
    if (index !== -1) {
      localStore.medicalRecords[index] = {
        ...localStore.medicalRecords[index],
        ...updates
      };
      return new MedicalRecord(localStore.medicalRecords[index]);
    }
    return null;
  }

  async deleteOne() {
    if (isSupabaseOnline()) {
      try {
        await supabase
          .from('medical_records')
          .delete()
          .eq('id', this._id);
      } catch {
        // Fall through
      }
    }

    const index = localStore.medicalRecords.findIndex(r => r.id === this._id || r._id === this._id);
    if (index !== -1) {
      localStore.medicalRecords.splice(index, 1);
    }
  }
}

export { MedicalRecord };
export default MedicalRecord;
