const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  duration: String,
  pharmacyStatus: { type: String, enum: ['pending', 'fulfilled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
