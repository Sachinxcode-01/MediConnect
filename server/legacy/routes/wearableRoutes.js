const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { protect } = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

router.post('/sync', async (req, res) => {
  const { patientId, heartRate, spO2, temperature, bloodPressure } = req.body;
  
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

  const compatData = { ...data, _id: data.id, patientId: data.patient_id };
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

// Analytics engine using Gemini 2.0 Flash
router.post('/:patientId/analyze', protect(), async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('wearable_history')
        .select('*')
        .eq('patient_id', req.params.patientId)
        .order('timestamp', { ascending: false })
        .limit(15);

      if (error || !data.length) return res.json({ analysis: "No medical telemetry data discovered." });
      
      const summaryContent = data.map(d => `Time: ${d.timestamp}, HR: ${d.heart_rate}, SpO2: ${d.spo2}%`).join(' | ');
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        You are an advanced biometric analysis engine.
        Analyze this recent patient telemetry stream: ${summaryContent}
        
        Provide a concise, highly professional clinical observation (under 40 words).
        Identify if trends are stable, improving, or deteriorating.
        Always focus on medical precision.
      `;

      const result = await model.generateContent(prompt);
      res.json({ analysis: result.response.text() || 'Telemetry analysis engine timed out.' });
    } catch (e) {
      console.error("Wearable Analytics error:", e);
      res.status(500).json({ message: "Neural Analytic Nodes offline.", error: e.message });
    }
});

router.post('/simulate', async (req, res) => {
  const { patientId } = req.body;
  
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
