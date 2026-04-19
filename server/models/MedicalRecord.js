const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  diagnosis: { type: String, required: true },
  prescription: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }],
  labReports: [{
    title: String,
    url: String,
    date: Date
  }],
  recordHash: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
