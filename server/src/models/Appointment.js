import supabase from '../config/supabase.js';

class Appointment {
  constructor(data) {
    this._id = data.id;
    this.id = data.id;
    this.patientId = data.patient_id;
    this.doctorId = data.doctor_id;
    this.title = data.title;
    this.description = data.description;
    this.startTime = data.start_time;
    this.endTime = data.end_time;
    this.date = data.date;
    this.status = data.status || 'scheduled';
    this.type = data.type || 'video';
    this.notes = data.notes || '';
    this.roomCode = data.room_code;
    this.createdAt = data.created_at;
    this.patient = data.patient || null;
    this.doctor = data.doctor || null;
  }

  static async create(data) {
    const row = {
      patient_id: data.patient || data.patientId,
      doctor_id: data.doctor || data.doctorId,
      title: data.title,
      description: data.description,
      start_time: data.startTime ? new Date(data.startTime).toISOString() : null,
      end_time: data.endTime ? new Date(data.endTime).toISOString() : null,
      date: data.date || (data.startTime ? new Date(data.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      status: data.status || 'scheduled',
      type: data.type || 'video',
      notes: data.notes || '',
      room_code: data.roomCode,
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
      .select(`*, patient:users!patient_id(id, name, email), doctor:users!doctor_id(id, name, specialization)`);

    if (query.patient) q = q.eq('patient_id', query.patient);
    if (query.doctor) q = q.eq('doctor_id', query.doctor);
    if (query.status) q = q.eq('status', query.status);
    if (query.startTime && query.startTime.$gte) q = q.gte('start_time', new Date(query.startTime.$gte).toISOString());

    q = q.order('start_time', { ascending: true }).limit(query.limit || 100);

    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(r => new Appointment(r));
  }

  static async findOne(query) {
    let q = supabase.from('appointments').select('*');
    
    if (query.doctor) q = q.eq('doctor_id', query.doctor);
    if (query.patient) q = q.eq('patient_id', query.patient);
    if (query.startTime && query.startTime.$lt) q = q.lt('start_time', new Date(query.startTime.$lt).toISOString());
    if (query.endTime && query.endTime.$gt) q = q.gt('end_time', new Date(query.endTime.$gt).toISOString());

    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data ? new Appointment(data) : null;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`*, patient:users!patient_id(id, name, email), doctor:users!doctor_id(id, name)`)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return new Appointment(data);
  }

  static async findByIdAndUpdate(id, updates) {
    const dbUpdates = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.notes) dbUpdates.notes = updates.notes;
    // ... add more as needed

    const { data, error } = await supabase
      .from('appointments')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return new Appointment(data);
  }
}

export { Appointment };
export default Appointment;
