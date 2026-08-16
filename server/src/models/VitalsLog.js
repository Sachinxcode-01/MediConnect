import supabase from '../config/supabase.js';

class VitalsLog {
  constructor(data) {
    this._id = data.id;
    this.id = data.id;
    this.patient = data.patient_id;
    this.heartRate = data.heart_rate;
    this.spo2 = data.spo2;
    this.temperature = data.temperature;
    this.bloodPressure = data.blood_pressure; // expected as string "120/80" or JSON
    this.respiratoryRate = data.respiratory_rate;
    this.weight = data.weight;
    this.glucoseLevel = data.glucose_level;
    this.device = data.device || 'manual';
    this.notes = data.notes || '';
    this.alerts = data.alerts || []; // JSONB
    this.alertTriggered = data.alert_triggered || false;
    this.createdAt = data.created_at;
  }

  static async create(data) {
    const row = {
      patient_id: data.patient,
      heart_rate: data.heartRate,
      spo2: data.spo2,
      temperature: data.temperature,
      blood_pressure: data.bloodPressure,
      respiratory_rate: data.respiratoryRate,
      weight: data.weight,
      glucose_level: data.glucoseLevel,
      device: data.device || 'manual',
      notes: data.notes || '',
      alerts: data.alerts || [],
      alert_triggered: (data.alerts && data.alerts.length > 0) ? true : false,
    };

    const { data: inserted, error } = await supabase
      .from('wearable_history')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return new VitalsLog(inserted);
  }

  static async find(query = {}) {
    let q = supabase.from('wearable_history').select('*');

    if (query.patient) q = q.eq('patient_id', query.patient);
    if (query.createdAt && query.createdAt.$gte) {
      q = q.gte('created_at', new Date(query.createdAt.$gte).toISOString());
    }

    q = q.order('created_at', { ascending: false }).limit(query.limit || 100);

    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(r => new VitalsLog(r));
  }

  static async findOne(query) {
    let q = supabase.from('wearable_history').select('*');
    if (query.patient) q = q.eq('patient_id', query.patient);
    
    q = q.order('created_at', { ascending: false }).limit(1);

    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data ? new VitalsLog(data) : null;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('wearable_history')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return new VitalsLog(data);
  }

  async save() {
    const { error } = await supabase
      .from('wearable_history')
      .update({
        alerts: this.alerts,
        alert_triggered: this.alertTriggered,
        notes: this.notes
      })
      .eq('id', this._id);

    if (error) throw error;
    return this;
  }
}

export { VitalsLog };
export default VitalsLog;
