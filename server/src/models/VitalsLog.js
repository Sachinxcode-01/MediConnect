import mongoose from 'mongoose';

const vitalsLogSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  heartRate: {
    type: Number,
    min: [30, 'Heart rate too low'],
    max: [220, 'Heart rate too high']
  },
  spo2: {
    type: Number,
    min: [50, 'SpO2 too low'],
    max: [100, 'SpO2 too high']
  },
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  temperature: {
    type: Number,
    min: [35, 'Temperature too low'],
    max: [42, 'Temperature too high']
  },
  respiratoryRate: {
    type: Number
  },
  weight: {
    type: Number
  },
  glucoseLevel: {
    type: Number
  },
  device: {
    type: String,
    enum: ['manual', 'smartwatch', 'fitness-tracker', 'medical-device', 'api']
  },
  alerts: [{
    type: {
      type: String,
      enum: ['high-heart-rate', 'low-spo2', 'high-bp', 'fever', 'irregular-rhythm']
    },
    triggered: { type: Boolean, default: true },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: Date
  }],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for time-series queries
vitalsLogSchema.index({ patient: 1, createdAt: -1 });
vitalsLogSchema.index({ 'alerts.type': 1, 'alerts.acknowledged': 1 });

export default mongoose.model('VitalsLog', vitalsLogSchema);
