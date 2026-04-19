const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { protect } = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Get all prescriptions for a patient
router.get('/', protect(['patient', 'doctor', 'admin']), async (req, res) => {
  try {
    let queryBuilder = supabase.from('prescriptions').select(`
        *,
        doctors (
            id,
            users ( name )
        )
    `);

    if (req.user.role === 'patient') {
       const { data: patient } = await supabase.from('patients').select('id').eq('user_id', req.user.id).single();
       if (patient) queryBuilder = queryBuilder.eq('patient_id', patient.id);
    } else if (req.user.role === 'doctor') {
       const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', req.user.id).single();
       if (doctor && !req.query.patientId) queryBuilder = queryBuilder.eq('doctor_id', doctor.id);
       else if (doctor && req.query.patientId) queryBuilder = queryBuilder.eq('patient_id', req.query.patientId);
    }

    const { data: prescriptions, error } = await queryBuilder.order('created_at', { ascending: false });
    if (error) throw error;

    const mapped = prescriptions.map(p => ({
        ...p,
        _id: p.id,
        doctorId: {
            _id: p.doctors?.id,
            name: p.doctors?.users?.name
        }
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prescriptions', error: error.message });
  }
});

// Create a new prescription
router.post('/', protect(['doctor', 'admin']), async (req, res) => {
  try {
    const { patientId, medication, dosage, frequency, duration, instructions } = req.body;

    const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', req.user.id).single();

    const { data: newPrescription, error } = await supabase
        .from('prescriptions')
        .insert([{
            patient_id: patientId,
            doctor_id: doctor?.id,
            medication,
            dosage,
            frequency,
            duration,
            instructions
        }])
        .select()
        .single();

    if (error) throw error;
    res.status(201).json({ ...newPrescription, _id: newPrescription.id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating prescription', error: error.message });
  }
});

// AI Prescription Analysis
router.post('/:id/analyze', protect(['patient', 'doctor']), async (req, res) => {
  try {
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !prescription) return res.status(404).json({ message: 'Prescription not found' });

    const prompt = `
      You are a helpful healthcare assistant. Explain the following prescription in a patient-friendly way.
      Medication: ${prescription.medication}
      Dosage: ${prescription.dosage}
      Frequency: ${prescription.frequency}
      Duration: ${prescription.duration}
      Instructions: ${prescription.instructions}

      Provide your response in JSON format with three fields:
      1. "overview": A simple explanation of what this medication is for (1-2 sentences).
      2. "howToTake": Clear, bulleted instructions on how to use it safely.
      3. "tips": 2-3 important safety tips or things to avoid (e.g., "Don't take on an empty stomach").
      
      Keep it encouraging and very clear.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(result.text));
  } catch (error) {
    console.error("Prescription Analysis Error:", error);
    res.status(500).json({ message: "Failed to analyze prescription.", error: error.message });
  }
});

module.exports = router;
