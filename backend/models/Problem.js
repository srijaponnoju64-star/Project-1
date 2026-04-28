const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ['food','health','education','shelter','sanitation','transport','elderly','children','disaster','environment','water','electricity','roads','crime','other'], required: true },
  urgencyLevel:{ type: String, enum: ['critical','high','medium','low'], default: 'medium' },
  location:    { type: String, default: '' },
  coordinates: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [78.4867, 17.3850] } },
  address:     { type: String, default: '' },
  peopleAffected: { type: Number, default: 1 },
  images:      [{ type: String }],
  voiceNote:   { type: String, default: '' },
  deadline:    { type: Date },
  aiAnalysis:  { type: String, default: '' },
  aiUrgencyScore: { type: Number, default: 0 },
  aiRecommendedTeam: { type: String, default: '' },
  status: { type: String, enum: ['pending','analysed','assigned','in_progress','resolved','closed'], default: 'pending' },
  assignedNGO:  { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
  assignedTeam: { type: String, default: '' },
  assignedTo:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedAt:   { type: Date },
  resolvedAt:   { type: Date },
  resolutionNote: { type: String, default: '' },
  progress:    { type: Number, default: 0 },
  updates: [{
    message:   { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    text:      { type: String },
    postedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role:      { type: String },
    postedAt:  { type: Date, default: Date.now }
  }],
  history: [{
    action:    { type: String },
    doneBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doneAt:    { type: Date, default: Date.now },
    note:      { type: String }
  }]
}, { timestamps: true });

problemSchema.index({ coordinates: '2dsphere' });
module.exports = mongoose.model('Problem', problemSchema);