import supabase from '../config/supabase.js';

class MedicalRecord {
  constructor(data) {
    this._id = data.id;
    this.id = data.id;
    this.patient = data.patient_id;
    this.doctor = data.doctor_id;
    this.type = data.type;
    this.title = data.title;
    this.description = data.description;
    this.fileUrl = data.file_url || '';
    this.tags = data.tags || [];
    this.visitDate = data.date || data.visitDate;
    this.createdAt = data.created_at;
  }

  static async create(data) {
    const row = {
      patient_id: data.patient,
      doctor_id: data.doctor,
      type: data.type,
      title: data.title,
      description: data.description,
      file_url: data.fileUrl || '',
      tags: data.tags || [],
      date: data.visitDate ? new Date(data.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    };

    const { data: inserted, error } = await supabase
      .from('medical_records')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return new MedicalRecord(inserted);
  }

  static async find(query) {
    let q = supabase
      .from('medical_records')
      .select(`*, patient:patients!patient_id(id, user_id, users!user_id(name, email)), doctor:doctors!doctor_id(id, user_id, specialization, users!user_id(name))`);

    if (query.patient) q = q.eq('patient_id', query.patient);
    if (query.doctor) q = q.eq('doctor_id', query.doctor);
    q = q.order('created_at', { ascending: false }).limit(query.limit || 100);

    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(r => new MedicalRecord(r));
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return new MedicalRecord(data);
  }

  static async findByIdAndUpdate(id, updates, opts) {
    const { data, error } = await supabase
      .from('medical_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return new MedicalRecord(data);
  }

  async deleteOne() {
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', this._id);
    if (error) throw error;
  }
}

export { MedicalRecord };
export default MedicalRecord;
