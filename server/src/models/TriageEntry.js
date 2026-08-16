import supabase from '../config/supabase.js';

class TriageEntry {
  constructor(data) {
    this._id = data.id;
    this.id = data.id;
    this.patient = data.patient || data.patient_id;
    this.patientId = data.patient_id || (typeof data.patient === 'object' ? data.patient?.id : data.patient);
    this.symptoms = data.symptoms;
    this.severity = data.severity;
    this.aiAnalysis = data.ai_analysis;
    this.status = data.status || 'pending';
    this.assignedDoctor = data.assigned_doctor_id || data.assignedDoctor || null;
    this.clinicalNotes = data.clinical_notes || data.notes || [];
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at || data.created_at;
  }

  static async create(data) {
    const severity = data.aiAnalysis?.severity || data.severity || 'medium';
    const row = {
      patient_id: data.patient,
      symptoms: data.symptoms,
      severity,
      ai_analysis: data.aiAnalysis || {},
      status: data.status || (severity === 'critical' ? 'escalated' : 'pending'),
      assigned_doctor_id: data.assignedDoctor || null,
      clinical_notes: data.clinicalNotes || []
    };

    const { data: inserted, error } = await supabase
      .from('triage_entries')
      .insert(row)
      .select('*, patient:users!patient_id(id, name, email)')
      .single();

    if (error) {
      // Fallback if relation select fails
      const { data: fallback, error: err2 } = await supabase
        .from('triage_entries')
        .insert(row)
        .select()
        .single();
      if (err2) throw err2;
      return new TriageEntry(fallback);
    }
    return new TriageEntry(inserted);
  }

  static async find(query = {}) {
    let q = supabase
      .from('triage_entries')
      .select('*, patient:users!patient_id(id, name, email)');

    if (query.patient) q = q.eq('patient_id', query.patient);
    if (query.status) q = q.eq('status', query.status);
    if (query.severity) q = q.eq('severity', query.severity);
    if (query.assignedDoctor) q = q.eq('assigned_doctor_id', query.assignedDoctor);

    q = q.order('created_at', { ascending: false }).limit(query.limit || 100);

    const { data, error } = await q;
    if (error) {
      // Fallback without join
      let q2 = supabase.from('triage_entries').select('*');
      if (query.patient) q2 = q2.eq('patient_id', query.patient);
      if (query.status) q2 = q2.eq('status', query.status);
      q2 = q2.order('created_at', { ascending: false }).limit(query.limit || 100);
      const { data: fallback, error: err2 } = await q2;
      if (err2) throw err2;
      return (fallback || []).map(r => new TriageEntry(r));
    }
    return (data || []).map(r => new TriageEntry(r));
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('triage_entries')
      .select('*, patient:users!patient_id(id, name, email)')
      .eq('id', id)
      .single();

    if (error || !data) {
      const { data: fallback } = await supabase
        .from('triage_entries')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!fallback) return null;
      return new TriageEntry(fallback);
    }
    return new TriageEntry(data);
  }

  static async findByIdAndUpdate(id, updateQuery, opts = {}) {
    let updates = {};
    if (updateQuery.status) updates.status = updateQuery.status;
    if (updateQuery.assignedDoctor !== undefined) updates.assigned_doctor_id = updateQuery.assignedDoctor;
    if (updateQuery.assigned_doctor_id !== undefined) updates.assigned_doctor_id = updateQuery.assigned_doctor_id;
    if (updateQuery.clinicalNotes) updates.clinical_notes = updateQuery.clinicalNotes;
    if (updateQuery.clinical_notes) updates.clinical_notes = updateQuery.clinical_notes;
    if (updateQuery.severity) updates.severity = updateQuery.severity;
    if (updateQuery.ai_analysis) updates.ai_analysis = updateQuery.ai_analysis;
    if (updateQuery.$push?.notes) {
      // Fetch existing and push note
      const existing = await TriageEntry.findById(id);
      const notesArr = Array.isArray(existing?.clinicalNotes) ? [...existing.clinicalNotes] : [];
      notesArr.push(updateQuery.$push.notes);
      updates.clinical_notes = notesArr;
    }

    const { data, error } = await supabase
      .from('triage_entries')
      .update(updates)
      .eq('id', id)
      .select('*, patient:users!patient_id(id, name, email)')
      .single();

    if (error) {
      const { data: fallback, error: err2 } = await supabase
        .from('triage_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (err2) throw err2;
      return new TriageEntry(fallback);
    }
    return new TriageEntry(data);
  }
}

export { TriageEntry };
export default TriageEntry;
