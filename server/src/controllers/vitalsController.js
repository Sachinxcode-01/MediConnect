import { VitalsLog, User } from '../models/index.js';

// @desc    Submit vitals reading
// @route   POST /api/vitals
// @access  Private
export const submitVitals = async (req, res, next) => {
  try {
    const { heartRate, spo2, bloodPressure, temperature, respiratoryRate, weight, glucoseLevel, device, notes } = req.body;

    const vitalsData = { patient: req.user.id, device: device || 'manual' };
    
    if (heartRate) vitalsData.heartRate = heartRate;
    if (spo2) vitalsData.spo2 = spo2;
    if (bloodPressure) vitalsData.bloodPressure = bloodPressure;
    if (temperature) vitalsData.temperature = temperature;
    if (respiratoryRate) vitalsData.respiratoryRate = respiratoryRate;
    if (weight) vitalsData.weight = weight;
    if (glucoseLevel) vitalsData.glucoseLevel = glucoseLevel;
    if (notes) vitalsData.notes = notes;

    // Check for alerts
    const alerts = [];
    
    if (heartRate && (heartRate > 100 || heartRate < 60)) {
      alerts.push({ type: heartRate > 100 ? 'high-heart-rate' : 'irregular-rhythm' });
    }
    if (spo2 && spo2 < 95) {
      alerts.push({ type: 'low-spo2' });
    }
    if (bloodPressure && (bloodPressure.systolic > 140 || bloodPressure.diastolic > 90)) {
      alerts.push({ type: 'high-bp' });
    }
    if (temperature && temperature > 38) {
      alerts.push({ type: 'fever' });
    }

    if (alerts.length > 0) {
      vitalsData.alerts = alerts;
    }

    const vitalsLog = await VitalsLog.create(vitalsData);

    res.status(201).json({ success: true, data: vitalsLog });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vitals history
// @route   GET /api/vitals/history
// @access  Private
export const getVitalsHistory = async (req, res, next) => {
  try {
    const { patientId, days = 7 } = req.query;
    const patient = patientId || req.user.id;
    
    // Authorization check
    if (patient !== req.user.id.toString() && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const vitals = await VitalsLog.find({ 
      patient, 
      createdAt: { $gte: startDate } 
    }).sort('createdAt').limit(500);

    res.status(200).json({ success: true, count: vitals.length, data: vitals });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest vitals
// @route   GET /api/vitals/latest
// @access  Private
export const getLatestVitals = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    const patient = patientId || req.user.id;

    const vitals = await VitalsLog.findOne({ patient }).sort('-createdAt');

    if (!vitals) {
      return res.status(404).json({ success: false, message: 'No vitals recorded' });
    }

    res.status(200).json({ success: true, data: vitals });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vitals for dashboard (recent readings)
// @route   GET /api/vitals/dashboard
// @access  Private
export const getDashboardVitals = async (req, res, next) => {
  try {
    const vitals = await VitalsLog.find({ patient: req.user.id })
      .sort('-createdAt')
      .limit(50);

    // Format for chart
    const chartData = vitals.map(v => ({
      timestamp: v.createdAt,
      heartRate: v.heartRate,
      spo2: v.spo2,
      temperature: v.temperature,
      systolic: v.bloodPressure?.systolic,
      diastolic: v.bloodPressure?.diastolic
    })).reverse();

    res.status(200).json({ success: true, data: chartData });
  } catch (error) {
    next(error);
  }
};

// @desc    Acknowledge alert
// @route   PUT /api/vitals/:id/acknowledge
// @access  Private (Doctor)
export const acknowledgeAlert = async (req, res, next) => {
  try {
    const { alertType } = req.body;

    const vitals = await VitalsLog.findById(req.params.id);
    if (!vitals) {
      return res.status(404).json({ success: false, message: 'Vitals record not found' });
    }

    const alert = vitals.alerts.find(a => a.type === alertType);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = req.user.id;
    alert.acknowledgedAt = new Date();

    await vitals.save();

    res.status(200).json({ success: true, data: vitals });
  } catch (error) {
    next(error);
  }
};
