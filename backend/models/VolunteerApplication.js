const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  volunteer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  phone:       { type: String, default: '' },
  whyJoin:     { type: String, required: true },
  skills:      { type: String, default: '' },
  experience:  { type: String, default: '' },
  availability:{ type: String, default: '' },
  area:        { type: String, default: '' },
  voiceNote:   { type: String, default: '' },
  // AI Analysis
  aiScore:     { type: Number, default: 0 },
  aiSummary:   { type: String, default: '' },
  aiDecision:  { type: String, enum: ['pending','recommended','not_recommended'], default: 'pending' },
  // NGO Head Decision
  status:      { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  ngoResponse: { type: String, default: '' },
  reviewedAt:  { type: Date },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('VolunteerApplication', applicationSchema);