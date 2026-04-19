const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: { type: String, required: true },
  licenseNo: { type: String, required: true },
  hospital: { type: String },
  availability: [{
    dayOfWeek: Number,
    startTime: String,
    endTime: String
  }],
  rating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
