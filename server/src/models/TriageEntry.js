import supabase from '../config/supabase.js';

class TriageEntry {
  constructor(data) {
    this._id = data.id;
    this.id = data.id;
    this.patient = data.patient_id;
    this.symptoms = data.symptoms;
    this.severity = data.severity;
    this.aiAnalysis = data.ai_analysis;
    this.status = data.status || 'pending';
    this.createdAt = data.created_at;
  }

  static async create(data) {
    const severity = data.aiAnalysis?.severity || data.severity || 'medium';
    const row = {
      patient_id: data.patient,
      symptoms: data.symptoms,
      severity,
      ai_analysis: data.aiAnalysis || {},
      status: data.status || (severity === 'critical' ? 'escalated' : 'pending'),
    };

    const { data: inserted, error } = await supabase
      .from('triage_entries')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return new TriageEntry(inserted);
  }

  static async find(query) {
    let q = supabase.from('triage_entries').select('*');

    if (query.patient) q = q.eq('patient_id', query.patient);
    if (query.status) q = q.eq('status', query.status);

    q = q.order('created_at', { ascending: false }).limit(query.limit || 50);

    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(r => new TriageEntry(r));
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('triage_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return new TriageEntry(data);
  }

  static async findByIdAndUpdate(id, updateQuery, opts) {
    let updates = {};
    if (updateQuery.status) updates.status = updateQuery.status;
    if (updateQuery.$push?.notes) updates.notes = updateQuery.$push.notes; // flatten for now

    const { data, error } = await supabase
      .from('triage_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return new TriageEntry(data);
  }
}

export { TriageEntry };
export default TriageEntry;
