import supabase from '../config/supabase.js';

class Appointment {
  constructor(data) {
    this._id = data.id;
    this.id = data.id;
    this.patientId = data.patient_id;
    this.doctorId = data.doctor_id;
    this.date = data.date;
    this.status = data.status || 'scheduled';
    this.type = data.type || 'video';
    this.notes = data.notes || '';
    this.createdAt = data.created_at;
    this.patient = data.patient || null;
    this.doctor = data.doctor || null;
  }

  static async create(data) {
    const row = {
      patient_id: data.patient || data.patientId,
      doctor_id: data.doctor || data.doctorId,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      status: data.status || 'scheduled',
      type: data.type || 'video',
      notes: data.notes || '',
    };

    const { data: inserted, error } = await supabase
      .from('appointments')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return new Appointment(inserted);
  }

  static async find(query = {}) {
    let q = supabase
      .from('appointments')
      .select(`*, patient:patients!patient_id(id, user_id), doctor:doctors!doctor_id(id, user_id, specialization)`);

    if (query.patient_id) q = q.eq('patient_id', query.patient_id);
    if (query.doctor_id) q = q.eq('doctor_id', query.doctor_id);
    if (query.status) q = q.eq('status', query.status);

    q = q.order('date', { ascending: false }).limit(query.limit || 100);

    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(r => new Appointment(r));
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return new Appointment(data);
  }

  static async findByIdAndUpdate(id, updates, opts) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return new Appointment(data);
  }
}

export { Appointment };
export default Appointment;
