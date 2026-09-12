const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini SDK
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mediconnect_records',
    resource_type: 'auto', 
  },
});
const upload = multer({ storage: storage });

router.get('/', protect(['patient', 'doctor', 'admin']), async (req, res) => {
  try {
    let queryBuilder = supabase.from('medical_records').select(`
        *,
        patients (
            id,
            users ( name )
        ),
        doctors (
            id,
            users ( name )
        )
    `);

    if (req.user.role === 'patient') {
       // Need to find patient_id first
       const { data: patient } = await supabase.from('patients').select('id').eq('user_id', req.user.id).single();
       if (patient) queryBuilder = queryBuilder.eq('patient_id', patient.id);
    } else if (req.user.role === 'doctor' && req.query.patientId) {
       queryBuilder = queryBuilder.eq('patient_id', req.query.patientId);
    }

    const { data: records, error } = await queryBuilder.order('date', { ascending: false });
    if (error) throw error;

    // Map for frontend compat
    const mapped = records.map(r => ({
        ...r,
        _id: r.id,
        patientId: {
            _id: r.patients?.id,
            name: r.patients?.users?.name
        },
        doctorId: {
            _id: r.doctors?.id,
            name: r.doctors?.users?.name
        }
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching records', error: error.message });
  }
});

router.post('/:id/summarize', protect(['patient', 'doctor']), async (req, res) => {
    try {
        const { data: record, error } = await supabase.from('medical_records').select('*').eq('id', req.params.id).single();
        if (error || !record) return res.status(404).json({ message: 'Record not found' });
        
        const prompt = `Analyze this medical record titled "${record.title}". Description: "${record.description}". Record Type: ${record.type}. Provide a brief 2-sentence patient-friendly summary and 1 crucial next step. Avoid medical jargon where possible.`;
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ summary: text });
    } catch (e) {
        console.error("Summarization Error:", e);
        res.status(500).json({ message: "Failed to summarize record.", error: e.message });
    }
});

router.post('/', protect(['doctor', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const { patientId, type, title, description } = req.body;
    let fileUrl = '';
    
    if (req.file && req.file.path) {
        fileUrl = req.file.path; 
    } else {
        return res.status(400).json({ message: 'File upload is required.' });
    }

    // Find doctor_id for current user
    const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', req.user.id).single();

    const { data: newRecord, error } = await supabase
        .from('medical_records')
        .insert([{
            patient_id: patientId,
            doctor_id: doctor?.id,
            type,
            title,
            description,
            file_url: fileUrl
        }])
        .select()
        .single();

    if (error) throw error;
    res.status(201).json({ ...newRecord, _id: newRecord.id });
  } catch (error) {
    console.error('Record upload error:', error);
    res.status(500).json({ message: 'Error creating record', error: error.message });
  }
});

// NEW: Save AI Scribe Clinical Note
router.post('/scribe', protect(['doctor']), async (req, res) => {
  try {
    const { patientId, consultationBrief } = req.body;
    
    if (!patientId || !consultationBrief) {
      return res.status(400).json({ message: 'Patient ID and brief content are required.' });
    }

    // Find doctor_id
    const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', req.user.id).single();

    const { data: newRecord, error } = await supabase
        .from('medical_records')
        .insert([{
            patient_id: patientId,
            doctor_id: doctor?.id,
            type: 'Consultation Brief',
            title: `AI Consultation Brief - ${new Date().toLocaleDateString()}`,
            description: consultationBrief,
            file_url: 'AI_GENERATED' // Placeholder since this is a digital-only note
        }])
        .select()
        .single();

    if (error) throw error;
    res.status(201).json({ ...newRecord, _id: newRecord.id });
  } catch (error) {
    console.error('Scribe save error:', error);
    res.status(500).json({ message: 'Error saving clinical note', error: error.message });
  }
});

module.exports = router;
