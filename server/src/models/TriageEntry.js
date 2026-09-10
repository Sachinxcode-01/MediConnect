import supabase, { isSupabaseOnline } from '../config/supabase.js';
import { localStore } from './localStore.js';

class TriageEntry {
  constructor(data) {
    this._id = data.id || data._id;
    this.id = data.id || data._id;
    this.patient = data.patient || data.patient_id;
    this.patientId = data.patient_id || (typeof data.patient === 'object' ? data.patient?.id : data.patient);
    this.symptoms = data.symptoms;
    this.severity = data.severity || data.ai_analysis?.severity || 'medium';
    this.aiAnalysis = data.ai_analysis || data.aiAnalysis || {};
    this.status = data.status || 'pending';
    this.assignedDoctor = data.assigned_doctor_id || data.assignedDoctor || null;
    this.clinicalNotes = data.clinical_notes || data.clinicalNotes || [];
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || data.created_at;
  }

  static _hydrateRelations(row) {
    const entry = new TriageEntry(row);
    if (!entry.patient || typeof entry.patient === 'string') {
      const p = localStore.users.find(u => u.id === entry.patientId || u._id === entry.patientId);
      if (p) entry.patient = { id: p.id, name: p.name, email: p.email, phone: p.phone };
    }
    return entry;
  }

  static async create(data) {
    const severity = data.aiAnalysis?.severity || data.severity || 'medium';
    const newId = `trg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const row = {
      id: newId,
      _id: newId,
      patient_id: data.patient || data.patientId,
      symptoms: data.symptoms,
      severity,
      ai_analysis: data.aiAnalysis || {},
      status: data.status || (severity === 'critical' ? 'escalated' : 'pending'),
      assigned_doctor_id: data.assignedDoctor || null,
      clinical_notes: data.clinicalNotes || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseOnline()) {
      try {
        const { data: inserted, error } = await supabase
          .from('triage_entries')
          .insert(row)
          .select('*, patient:users!patient_id(id, name, email)')
          .single();

        if (!error && inserted) {
          return TriageEntry._hydrateRelations(inserted);
        }
      } catch {
        // Fall through
      }
    }

    localStore.triageEntries.unshift(row);
    return TriageEntry._hydrateRelations(row);
  }

  static async find(query = {}) {
    if (isSupabaseOnline()) {
      try {
        let q = supabase
          .from('triage_entries')
          .select('*, patient:users!patient_id(id, name, email)');

        if (query.patient) q = q.eq('patient_id', query.patient);
        if (query.status) q = q.eq('status', query.status);
        if (query.severity) q = q.eq('severity', query.severity);
        if (query.assignedDoctor) q = q.eq('assigned_doctor_id', query.assignedDoctor);

        q = q.order('created_at', { ascending: false }).limit(query.limit || 100);

        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(r => TriageEntry._hydrateRelations(r));
        }
      } catch {
        // Fall through
      }
    }

    let results = localStore.triageEntries;
    if (query.patient) {
      results = results.filter(t => t.patient_id === query.patient || t.patientId === query.patient);
    }
    if (query.status) {
      results = results.filter(t => t.status === query.status);
    }
    if (query.severity) {
      results = results.filter(t => t.severity === query.severity);
    }
    if (query.assignedDoctor) {
      results = results.filter(t => t.assigned_doctor_id === query.assignedDoctor);
    }

    return results.map(r => TriageEntry._hydrateRelations(r));
  }

  static async findById(id) {
    if (isSupabaseOnline()) {
      try {
        const { data, error } = await supabase
          .from('triage_entries')
          .select('*, patient:users!patient_id(id, name, email)')
          .eq('id', id)
          .single();

        if (!error && data) return TriageEntry._hydrateRelations(data);
      } catch {
        // Fall through
      }
    }

    const found = localStore.triageEntries.find(t => t.id === id || t._id === id);
    return found ? TriageEntry._hydrateRelations(found) : null;
  }

  static async findByIdAndUpdate(id, updateQuery) {
    let updates = {};
    if (updateQuery.status) updates.status = updateQuery.status;
    if (updateQuery.assignedDoctor !== undefined) updates.assigned_doctor_id = updateQuery.assignedDoctor;
    if (updateQuery.assigned_doctor_id !== undefined) updates.assigned_doctor_id = updateQuery.assigned_doctor_id;
    if (updateQuery.clinicalNotes) updates.clinical_notes = updateQuery.clinicalNotes;
    if (updateQuery.clinical_notes) updates.clinical_notes = updateQuery.clinical_notes;
    if (updateQuery.severity) updates.severity = updateQuery.severity;
    if (updateQuery.ai_analysis) updates.ai_analysis = updateQuery.ai_analysis;
    if (updateQuery.$push?.notes) {
      const existing = await TriageEntry.findById(id);
      const notesArr = Array.isArray(existing?.clinicalNotes) ? [...existing.clinicalNotes] : [];
      notesArr.push(updateQuery.$push.notes);
      updates.clinical_notes = notesArr;
    }

    if (isSupabaseOnline()) {
      try {
        const { data, error } = await supabase
          .from('triage_entries')
          .update(updates)
          .eq('id', id)
          .select('*, patient:users!patient_id(id, name, email)')
          .single();

        if (!error && data) return TriageEntry._hydrateRelations(data);
      } catch {
        // Fall through
      }
    }

    const index = localStore.triageEntries.findIndex(t => t.id === id || t._id === id);
    if (index !== -1) {
      localStore.triageEntries[index] = {
        ...localStore.triageEntries[index],
        ...updates,
        status: updates.status || localStore.triageEntries[index].status,
        clinical_notes: updates.clinical_notes || localStore.triageEntries[index].clinical_notes,
        updated_at: new Date().toISOString()
      };
      return TriageEntry._hydrateRelations(localStore.triageEntries[index]);
    }
    return null;
  }
}

export { TriageEntry };
export default TriageEntry;
