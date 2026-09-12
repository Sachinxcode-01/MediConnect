const mongoose = require('mongoose');

const wearableDataSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  heartRate: { type: Number },
  spO2: { type: Number },
  temperature: { type: Number },
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  timestamp: { type: Date, default: Date.now },
  alertTriggered: { type: Boolean, default: false }
});

module.exports = mongoose.model('WearableData', wearableDataSchema);
