import { TriageEntry, User } from '../models/index.js';
import { analyzeConsultation, analyzeSymptoms } from '../utils/aiService.js';

// @desc    Submit symptoms for AI triage
// @route   POST /api/triage
// @access  Private (Patient)
export const submitTriage = async (req, res, next) => {
  try {
    const { symptoms, vitalSigns } = req.body;

    if (!symptoms || symptoms.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide detailed symptoms (at least 10 characters)'
      });
    }

    let aiAnalysis;
    try {
      aiAnalysis = await analyzeSymptoms(symptoms, vitalSigns);
    } catch {
      aiAnalysis = {
        severity: 'medium',
        urgency: 'within_24h',
        symptoms_detected: [symptoms],
        possible_categories: ['General Symptoms'],
        recommended_next_step: 'Consult a healthcare professional',
        red_flags: [],
        confidence: 0.5,
        disclaimer: 'Seek immediate care if symptoms worsen'
      };
    }

    const triageEntry = await TriageEntry.create({
      patient: req.user.id,
      symptoms,
      aiAnalysis,
      status: aiAnalysis.severity === 'critical' ? 'escalated' : 'pending'
    });

    // Broadcast real-time Socket event to doctor role room
    const io = req.app.get('io');
    if (io) {
      io.to('role:doctor').emit('new-triage-entry', {
        triageId: triageEntry.id,
        severity: triageEntry.severity,
        patientName: req.user.name || 'Patient',
        symptoms: triageEntry.symptoms,
        createdAt: triageEntry.createdAt
      });
    }

    res.status(201).json({ success: true, data: triageEntry });
  } catch (error) {
    console.error('Triage error:', error);
    next(error);
  }
};

// @desc    Get patient triage history
// @route   GET /api/triage
// @access  Private
export const getTriageHistory = async (req, res, next) => {
  try {
    const entries = await TriageEntry.find({ patient: req.user.id });
    res.status(200).json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all triage entries (doctors/admins)
// @route   GET /api/triage/all
// @access  Private (Doctor, Admin)
export const getAllTriageEntries = async (req, res, next) => {
  try {
    const { severity, status } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    const entries = await TriageEntry.find(filter);
    res.status(200).json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    next(error);
  }
};

// @desc    Update triage status
// @route   PUT /api/triage/:id/status
// @access  Private (Doctor)
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'in-progress', 'completed', 'escalated'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const entry = await TriageEntry.findByIdAndUpdate(req.params.id, { status });
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

export const getTriageEntry = async (req, res, next) => {
  try {
    const entry = await TriageEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Triage entry not found' });
    }

    const patientId = entry.patientId || entry.patient?.id || entry.patient?._id || entry.patient;
    if (req.user.role === 'patient' && String(patientId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this triage case' });
    }

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign doctor to triage entry
// @route   PUT /api/triage/:id/assign
// @access  Private (Doctor)
export const assignDoctor = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const entry = await TriageEntry.findByIdAndUpdate(req.params.id, {
      assignedDoctor: doctorId,
      status: 'in-progress'
    });
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Add clinical note to triage entry
// @route   POST /api/triage/:id/notes
// @access  Private (Doctor)
export const addNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }

    const newNote = {
      doctorId: req.user.id,
      doctorName: req.user.name || 'Doctor',
      note: note.trim(),
      timestamp: new Date().toISOString()
    };

    const entry = await TriageEntry.findByIdAndUpdate(req.params.id, {
      $push: { notes: newNote }
    });

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze chat history for AI clinical scribe
// @route   POST /api/triage/analyze
// @access  Private (Doctor)
export const analyzeChatHistory = async (req, res, next) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        message: 'No conversation history provided'
      });
    }

    const analysis = await analyzeConsultation(symptoms);

    res.status(200).json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

// @desc    Evaluate symptoms without saving entry (for interactive chatbot / pre-triage)
// @route   POST /api/triage/evaluate
// @access  Public / Optional Auth
export const evaluateSymptoms = async (req, res, next) => {
  try {
    const { symptoms, patientAge, vitalSigns } = req.body;
    if (!symptoms || symptoms.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Please describe symptoms' });
    }

    let aiAnalysis;
    try {
      aiAnalysis = await analyzeSymptoms(symptoms, vitalSigns);
    } catch {
      aiAnalysis = {
        severity: 'medium',
        urgency: 'within_24h',
        symptoms_detected: [symptoms],
        possible_categories: ['General Health Evaluation'],
        recommended_next_step: 'Consult a primary care physician',
        red_flags: [],
        confidence: 0.75,
        disclaimer: 'MediConnect AI is an informational pre-triage tool and does not provide formal diagnosis.'
      };
    }

    const urgencyLevel = aiAnalysis.severity === 'critical' ? 'EMERGENT' :
                         aiAnalysis.severity === 'high' ? 'URGENT' :
                         aiAnalysis.severity === 'medium' ? 'MODERATE' : 'ROUTINE';

    res.status(200).json({
      success: true,
      data: {
        status: 'PROCESSED',
        urgencyLevel,
        severity: aiAnalysis.severity,
        urgency: aiAnalysis.urgency,
        recommendedSpecialty: aiAnalysis.possible_categories?.[0] || 'General Medicine',
        redFlagsDetected: aiAnalysis.red_flags || [],
        clinicalRationale: aiAnalysis.recommended_next_step || 'Assessment based on clinical symptom guidelines.',
        suggestedDoctorQuestions: [
          'How long have you been experiencing these symptoms?',
          'Do the symptoms change with physical activity or rest?',
          'Are there any associated medications or allergies?'
        ],
        symptomsDetected: aiAnalysis.symptoms_detected || [symptoms],
        disclaimer: aiAnalysis.disclaimer || 'This assessment does not replace in-person medical evaluation.'
      }
    });
  } catch (error) {
    next(error);
  }
};

