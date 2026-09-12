const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  type: { type: String, enum: ['video', 'in-person'], default: 'video' },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  symptoms: { type: String },
  notes: { type: String },
  roomUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
