const mongoose = require('mongoose');

const triageQueueSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  symptoms: [{ type: String }],
  aiScore: { type: Number },
  status: { type: String, enum: ['waiting', 'assigned', 'dismissed'], default: 'waiting' },
  timestamp: { type: Date, default: Date.now },
  recommendedAction: String,
  urgency: String
});

module.exports = mongoose.model('TriageQueue', triageQueueSchema);
