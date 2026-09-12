const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dob: { type: Date },
  bloodGroup: { type: String },
  allergies: [{ type: String }],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  medicalHistory: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
