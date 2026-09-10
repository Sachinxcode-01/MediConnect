import supabase, { isSupabaseOnline } from '../config/supabase.js';
import { localStore } from './localStore.js';

class VitalsLog {
  constructor(data) {
    this._id = data.id || data._id;
    this.id = data.id || data._id;
    this.patient = data.patient_id || data.patient;
    this.patientId = data.patient_id || data.patient;
    this.heartRate = data.heart_rate !== undefined ? data.heart_rate : data.heartRate;
    this.spo2 = data.spo2;
    this.temperature = data.temperature;
    this.bloodPressure = data.blood_pressure || data.bloodPressure || '120/80';
    this.respiratoryRate = data.respiratory_rate || data.respiratoryRate || 16;
    this.weight = data.weight || 70;
    this.glucoseLevel = data.glucose_level || data.glucoseLevel || 95;
    this.device = data.device || 'MediConnect Biometric Streamer';
    this.notes = data.notes || '';
    this.alerts = data.alerts || [];
    this.alertTriggered = data.alert_triggered !== undefined ? data.alert_triggered : (this.alerts.length > 0);
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
  }

  static async create(data) {
    const newId = `vit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const row = {
      id: newId,
      _id: newId,
      patient_id: data.patient || data.patientId,
      heart_rate: data.heartRate,
      spo2: data.spo2,
      temperature: data.temperature,
      blood_pressure: data.bloodPressure,
      respiratory_rate: data.respiratoryRate,
      weight: data.weight,
      glucose_level: data.glucoseLevel,
      device: data.device || 'MediConnect Biometric Streamer',
      notes: data.notes || '',
      alerts: data.alerts || [],
      alert_triggered: (data.alerts && data.alerts.length > 0) ? true : false,
      created_at: new Date().toISOString()
    };

    if (isSupabaseOnline()) {
      try {
        const { data: inserted, error } = await supabase
          .from('wearable_history')
          .insert(row)
          .select()
          .single();

        if (!error && inserted) {
          return new VitalsLog(inserted);
        }
      } catch {
        // Fall through
      }
    }

    localStore.wearableHistory.unshift(row);
    return new VitalsLog(row);
  }

  static async find(query = {}) {
    if (isSupabaseOnline()) {
      try {
        let q = supabase.from('wearable_history').select('*');
        if (query.patient) q = q.eq('patient_id', query.patient);
        if (query.createdAt && query.createdAt.$gte) {
          q = q.gte('created_at', new Date(query.createdAt.$gte).toISOString());
        }
        q = q.order('created_at', { ascending: false }).limit(query.limit || 100);

        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(r => new VitalsLog(r));
        }
      } catch {
        // Fall through
      }
    }

    let results = localStore.wearableHistory;
    if (query.patient) {
      results = results.filter(v => v.patient_id === query.patient || v.patient === query.patient);
    }
    return results.map(r => new VitalsLog(r));
  }

  static async findOne(query) {
    if (isSupabaseOnline()) {
      try {
        let q = supabase.from('wearable_history').select('*');
        if (query.patient) q = q.eq('patient_id', query.patient);
        q = q.order('created_at', { ascending: false }).limit(1);

        const { data, error } = await q;
        if (!error && data && data.length > 0) return new VitalsLog(data[0]);
      } catch {
        // Fall through
      }
    }

    const filtered = query.patient
      ? localStore.wearableHistory.filter(v => v.patient_id === query.patient || v.patient === query.patient)
      : localStore.wearableHistory;

    return filtered.length > 0 ? new VitalsLog(filtered[0]) : null;
  }

  static async findById(id) {
    if (isSupabaseOnline()) {
      try {
        const { data, error } = await supabase
          .from('wearable_history')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) return new VitalsLog(data);
      } catch {
        // Fall through
      }
    }

    const found = localStore.wearableHistory.find(v => v.id === id || v._id === id);
    return found ? new VitalsLog(found) : null;
  }

  async save() {
    if (isSupabaseOnline()) {
      try {
        await supabase
          .from('wearable_history')
          .update({
            alerts: this.alerts,
            alert_triggered: this.alertTriggered,
            notes: this.notes
          })
          .eq('id', this._id);
      } catch {
        // Fall through
      }
    }

    const index = localStore.wearableHistory.findIndex(v => v.id === this._id || v._id === this._id);
    if (index !== -1) {
      localStore.wearableHistory[index] = {
        ...localStore.wearableHistory[index],
        alerts: this.alerts,
        alert_triggered: this.alertTriggered,
        notes: this.notes
      };
    }
    return this;
  }
}

export { VitalsLog };
export default VitalsLog;
