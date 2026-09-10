import supabase, { isSupabaseOnline } from '../config/supabase.js';
import { localStore } from './localStore.js';

class Appointment {
  constructor(data) {
    this._id = data.id || data._id;
    this.id = data.id || data._id;
    this.patientId = data.patient_id || data.patientId || (typeof data.patient === 'object' ? data.patient?.id : data.patient);
    this.doctorId = data.doctor_id || data.doctorId || (typeof data.doctor === 'object' ? data.doctor?.id : data.doctor);
    this.title = data.title;
    this.description = data.description;
    this.startTime = data.start_time || data.startTime;
    this.endTime = data.end_time || data.endTime;
    this.date = data.date;
    this.status = data.status || 'scheduled';
    this.type = data.type || 'video';
    this.notes = data.notes || '';
    this.roomCode = data.room_code || data.roomCode;
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.patient = data.patient || null;
    this.doctor = data.doctor || null;
  }

  static _hydrateRelations(row) {
    const apt = new Appointment(row);
    if (!apt.patient && apt.patientId) {
      const p = localStore.users.find(u => u.id === apt.patientId || u._id === apt.patientId);
      if (p) apt.patient = { id: p.id, name: p.name, email: p.email, phone: p.phone, profileImage: p.profile_image };
    }
    if (!apt.doctor && apt.doctorId) {
      const d = localStore.users.find(u => u.id === apt.doctorId || u._id === apt.doctorId);
      if (d) apt.doctor = { id: d.id, name: d.name, specialization: d.specialization || 'General Physician', profileImage: d.profile_image };
    }
    return apt;
  }

  static async create(data) {
    const newId = `apt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const row = {
      id: newId,
      _id: newId,
      patient_id: data.patient || data.patientId,
      doctor_id: data.doctor || data.doctorId,
      title: data.title || 'Clinical Consultation',
      description: data.description || 'Virtual clinical encounter',
      start_time: data.startTime ? new Date(data.startTime).toISOString() : new Date().toISOString(),
      end_time: data.endTime ? new Date(data.endTime).toISOString() : new Date(Date.now() + 3600000).toISOString(),
      date: data.date || (data.startTime ? new Date(data.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      status: data.status || 'scheduled',
      type: data.type || 'video',
      notes: data.notes || '',
      room_code: data.roomCode || `room-${Math.random().toString(36).substr(2, 8)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseOnline()) {
      try {
        const { data: inserted, error } = await supabase
          .from('appointments')
          .insert(row)
          .select()
          .single();

        if (!error && inserted) {
          return Appointment._hydrateRelations(inserted);
        }
      } catch {
        // Fall through
      }
    }

    localStore.appointments.unshift(row);
    return Appointment._hydrateRelations(row);
  }

  static async find(query = {}) {
    if (isSupabaseOnline()) {
      try {
        let q = supabase
          .from('appointments')
          .select(`*, patient:users!patient_id(id, name, email), doctor:users!doctor_id(id, name, specialization)`);

        if (query.patient) q = q.eq('patient_id', query.patient);
        if (query.doctor) q = q.eq('doctor_id', query.doctor);
        if (query.status) q = q.eq('status', query.status);
        if (query.startTime && query.startTime.$gte) q = q.gte('start_time', new Date(query.startTime.$gte).toISOString());

        q = q.order('start_time', { ascending: true }).limit(query.limit || 100);

        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(r => Appointment._hydrateRelations(r));
        }
      } catch {
        // Fall through
      }
    }

    let results = localStore.appointments;
    if (query.patient) {
      results = results.filter(a => a.patient_id === query.patient || a.patientId === query.patient);
    }
    if (query.doctor) {
      results = results.filter(a => a.doctor_id === query.doctor || a.doctorId === query.doctor);
    }
    if (query.status) {
      results = results.filter(a => a.status === query.status);
    }

    return results.map(r => Appointment._hydrateRelations(r));
  }

  static async findOne(query) {
    if (isSupabaseOnline()) {
      try {
        let q = supabase.from('appointments').select('*');
        if (query.doctor) q = q.eq('doctor_id', query.doctor);
        if (query.patient) q = q.eq('patient_id', query.patient);
        const { data, error } = await q.maybeSingle();
        if (!error && data) return Appointment._hydrateRelations(data);
      } catch {
        // Fall through
      }
    }

    const found = localStore.appointments.find(a => {
      if (query.doctor && a.doctor_id !== query.doctor) return false;
      if (query.patient && a.patient_id !== query.patient) return false;
      if (query.roomCode && a.room_code !== query.roomCode) return false;
      return true;
    });

    return found ? Appointment._hydrateRelations(found) : null;
  }

  static async findById(id) {
    if (isSupabaseOnline()) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`*, patient:users!patient_id(id, name, email), doctor:users!doctor_id(id, name)`)
          .eq('id', id)
          .single();

        if (!error && data) return Appointment._hydrateRelations(data);
      } catch {
        // Fall through
      }
    }

    const found = localStore.appointments.find(a => a.id === id || a._id === id);
    return found ? Appointment._hydrateRelations(found) : null;
  }

  static async findByIdAndUpdate(id, updates) {
    if (isSupabaseOnline()) {
      try {
        const dbUpdates = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.notes) dbUpdates.notes = updates.notes;
        if (updates.roomCode) dbUpdates.room_code = updates.roomCode;

        const { data, error } = await supabase
          .from('appointments')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) return Appointment._hydrateRelations(data);
      } catch {
        // Fall through
      }
    }

    const index = localStore.appointments.findIndex(a => a.id === id || a._id === id);
    if (index !== -1) {
      localStore.appointments[index] = {
        ...localStore.appointments[index],
        ...updates,
        status: updates.status || localStore.appointments[index].status,
        notes: updates.notes !== undefined ? updates.notes : localStore.appointments[index].notes,
        room_code: updates.roomCode || localStore.appointments[index].room_code
      };
      return Appointment._hydrateRelations(localStore.appointments[index]);
    }
    return null;
  }
}

export { Appointment };
export default Appointment;
