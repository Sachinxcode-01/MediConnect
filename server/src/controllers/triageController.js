import { TriageEntry, User } from '../models/index.js';
import { analyzeConsultation } from '../utils/aiService.js';

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

    // Use AI service if available, else placeholder
    let aiAnalysis;
    try {
      const text = await analyzeConsultation(symptoms);
      aiAnalysis = { severity: 'medium', summary: text };
    } catch {
      aiAnalysis = {
        severity: 'medium',
        possibleConditions: [{ name: 'Analysis unavailable', probability: 100 }],
        recommendedActions: [{ action: 'Consult a healthcare professional', urgency: 'routine' }],
        redFlags: ['Seek immediate care if symptoms worsen'],
        specialistReferral: { needed: false }
      };
    }

    const triageEntry = await TriageEntry.create({
      patient: req.user.id,
      symptoms,
      aiAnalysis,
      status: aiAnalysis.severity === 'critical' ? 'escalated' : 'pending'
    });

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
    const entries = await TriageEntry.find({});
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

    const entry = await TriageEntry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

export const getTriageEntry = async (req, res, next) => {
  try {
    const entry = await TriageEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

export const assignDoctor = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Doctor assignment via Supabase coming soon' });
};

export const addNote = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Notes via Supabase coming soon' });
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
