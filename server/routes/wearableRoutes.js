const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { protect } = require('../middleware/auth');
const { Ollama } = require('ollama');

// Initialize local Ollama for zero-leak privacy on wearables
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`
  }
});

router.post('/sync', async (req, res) => {
  const { patientId, heartRate, spO2, temperature, bloodPressure } = req.body;
  
  // patientId here might be the SQL UUID of the patient record
  let alertTriggered = false;
  if (heartRate > 120 || spO2 < 90 || temperature > 38.5) {
    alertTriggered = true;
  }

  const { data, error } = await supabase
    .from('wearable_history')
    .insert([{
      patient_id: patientId,
      heart_rate: heartRate,
      spo2: spO2,
      temperature: temperature,
      blood_pressure: typeof bloodPressure === 'object' ? `${bloodPressure.systolic}/${bloodPressure.diastolic}` : bloodPressure,
      alert_triggered: alertTriggered
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });

  // Map to maintain frontend compatibility
  const compatData = { ...data, _id: data.id, patientId: data.patient_id };

  // Emit live
  req.io.emit('vitals-update', compatData);
  if (alertTriggered) {
    req.io.emit('vital-alert', { patientId, message: 'Critical vitals detected!' });
  }
  
  res.json(compatData);
});

router.get('/:patientId/live', protect(), async (req, res) => {
  const { data, error } = await supabase
    .from('wearable_history')
    .select('*')
    .eq('patient_id', req.params.patientId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') return res.status(500).json({ message: error.message });
  res.json(data ? { ...data, _id: data.id } : null);
});

router.get('/:patientId/history', protect(), async (req, res) => {
  const { data, error } = await supabase
    .from('wearable_history')
    .select('*')
    .eq('patient_id', req.params.patientId)
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ message: error.message });
  
  const mapped = data.map(d => ({ ...d, _id: d.id }));
  res.json(mapped);
});

// Private analytics engine using Ollama
router.post('/:patientId/analyze', protect(), async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('wearable_history')
        .select('*')
        .eq('patient_id', req.params.patientId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error || !data.length) return res.json({ analysis: "No recent wearable data found." });
      
      const summaryContent = data.map(d => `HR: ${d.heart_rate}, SpO2: ${d.spo2}%`).join('; ');
      
      const response = await ollama.chat({
          model: 'medllama2',
          messages: [{ role: 'user', content: `Summarize this recent biometric data into a 2-sentence medical observation: ${summaryContent}` }]
      });

      res.json({ analysis: response.message.content || 'Analysis unavailable.' });
    } catch (e) {
      console.error("Wearable Analytics error:", e);
      res.status(500).json({ message: "Failed to connect to local Ollama analytics node.", error: e.message });
    }
});

router.post('/simulate', async (req, res) => {
  const { patientId } = req.body;
  
  // Verify patient exists in SQL
  const { data: p } = await supabase.from('patients').select('id').eq('user_id', patientId).single();
  const actualId = p ? p.id : patientId;

  const hr = Math.floor(Math.random() * (130 - 60) + 60);
  const spo2 = Math.floor(Math.random() * (100 - 85) + 85);
  const temp = (Math.random() * (39 - 36) + 36).toFixed(1);
  const bp = "120/80";
  
  let alertTriggered = (hr > 120 || spo2 < 90 || Number(temp) > 38.5);

  const { data, error } = await supabase
    .from('wearable_history')
    .insert([{
      patient_id: actualId,
      heart_rate: hr,
      spo2: spo2,
      temperature: Number(temp),
      blood_pressure: bp,
      alert_triggered: alertTriggered
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });

  const compatData = { ...data, _id: data.id, patientId: data.patient_id };
  req.io.emit('vitals-update', compatData);
  if (alertTriggered) {
    req.io.emit('vital-alert', { patientId: actualId, message: 'Critical vitals detected!' });
  }
  
  res.json(compatData);
});

module.exports = router;
