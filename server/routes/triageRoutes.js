const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = require('../utils/supabase');
const Groq = require('groq-sdk');

// Initialize Groq LPU API for ultra-low latency Triage
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/symptom-check', protect(['patient']), async (req, res) => {
  try {
    const { symptoms, age, existingConditions } = req.body;
    
    // Get patient record first
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (patientError || !patient) throw new Error('Patient record not found');

    // Call Groq (Llama 3)
    const prompt = `You are a medical triage assistant. Analyze symptoms: ${symptoms.join(', ')}. Age: ${age}. Conditions: ${existingConditions.join(', ')}. Return a JSON string with the following fields: severity (low|medium|high|critical), possibleConditions (array of 3 strings), recommendedAction (string), urgency (string), disclaimer (always include: "consult a real doctor"). Respond ONLY with valid JSON and no markdown formatting.`;
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'system', content: 'You are a medical API. Output only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const aiResText = completion.choices[0].message.content || "{}";
    const aiData = JSON.parse(aiResText);

    // Insert into triage_entries
    const { data: triage, error: triageError } = await supabase
      .from('triage_entries')
      .insert([{
        patient_id: patient.id,
        severity: aiData.severity || 'low',
        symptoms: symptoms.join(', '),
        ai_analysis: aiData,
        status: 'pending'
      }])
      .select(`
        *,
        patients (
          id,
          users (
            name
          )
        )
      `)
      .single();

    if (triageError) throw triageError;

    // Notify doctors (Adapt structure for frontend)
    const socketPayload = {
        ...triage,
        _id: triage.id,
        patientId: {
            _id: triage.patient_id,
            name: triage.patients.users.name
        }
    };
    req.io.emit('new-triage-entry', socketPayload);

    res.json(aiData);
  } catch (err) {
    console.error('Groq Triage API Error:', err);
    res.status(500).json({ 
        message: 'Triage API service failed.', 
        error: err.message 
    });
  }
});

router.get('/queue', protect(['doctor', 'admin']), async (req, res) => {
  try {
    const { data: queue, error } = await supabase
      .from('triage_entries')
      .select(`
        *,
        patients (
          id,
          users (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to maintain frontend compatibility
    const mappedQueue = queue.map(t => ({
        ...t,
        _id: t.id,
        patientId: {
            _id: t.patients?.id,
            name: t.patients?.users?.name
        }
    }));

    res.json(mappedQueue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/severity', protect(['doctor', 'admin']), async (req, res) => {
   const { data: triage, error } = await supabase
     .from('triage_entries')
     .update({ severity: req.body.severity })
     .eq('id', req.params.id)
     .select()
     .single();
   
   if (error) return res.status(500).json({ message: error.message });
   res.json({ ...triage, _id: triage.id });
});

router.post('/analyze', protect(['doctor']), async (req, res) => {
    try {
        const { symptoms, severity } = req.body;
        
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Act as a Senior Clinical Decision Support System. 
            Patient Symptoms: "${symptoms}"
            Triage Severity: ${severity}

            Generate a "Neuro-Brief" for the attending physician. 
            Include:
            1. **Differential Diagnostics**: Top 3 suspected conditions with ICD-10 logic.
            2. **Secondary Pathophysiology**: Potential underlying causes to investigate.
            3. **Clinical Protocol**: 3 immediate diagnostic tests or vital checks to prioritize.
            4. **Neural Alert**: Specific "Red Flag" symptoms associated with this case to monitor for.

            Format the response for a professional medical dashboard using clear markdown.
        `;
        
        const result = await model.generateContent(prompt);
        res.json({ analysis: result.response.text() });
    } catch (e) {
        res.status(500).json({ message: "Neural Analysis Engine offline.", error: e.message });
    }
});

module.exports = router;
