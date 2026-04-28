const mongoose = require('mongoose');

const needSchema = new mongoose.Schema({
  ngo:      { type: mongoose.Schema.Types.ObjectId, ref: 'NGO',  required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['food','health','education','shelter','sanitation','transport','elderly','children','disaster','other'],
    required: true,
  },
  urgencyLevel:       { type: String, enum: ['critical','high','medium','low'], default: 'medium' },
  requiredSkills:     [{ type: String }],
  volunteersNeeded:   { type: Number, default: 1 },
  volunteersAssigned: { type: Number, default: 0 },
  peopleAffected:     { type: Number, default: 0 },
  deadline:   { type: Date },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  address:          { type: String, default: '' },
  status:           { type: String, enum: ['pending','approved','active','in_progress','completed','cancelled'], default: 'pending' },
  urgencyScore:     { type: Number, default: 0 },
  tags:             [String],
  completedAt:      { type: Date },
  viewCount:        { type: Number, default: 0 },
}, { timestamps: true });

needSchema.index({ location: '2dsphere' });

needSchema.pre('save', function (next) {
  let score = 0;
  const urgencyMap = { critical: 40, high: 30, medium: 20, low: 10 };
  score += urgencyMap[this.urgencyLevel] || 20;
  if (this.peopleAffected >= 500) score += 30;
  else if (this.peopleAffected >= 100) score += 20;
  else if (this.peopleAffected >= 50) score += 15;
  else if (this.peopleAffected >= 10) score += 10;
  else score += 5;
  if (this.deadline) {
    const d = Math.ceil((this.deadline - Date.now()) / 86400000);
    if (d <= 1) score += 20;
    else if (d <= 3) score += 15;
    else if (d <= 7) score += 10;
    else if (d <= 14) score += 5;
  }
  const gap = this.volunteersNeeded - this.volunteersAssigned;
  if (gap >= 10) score += 10;
  else if (gap >= 5) score += 7;
  else if (gap >= 2) score += 5;
  else score += 3;
  this.urgencyScore = Math.min(score, 100);
  next();
});

module.exports = mongoose.model('Need', needSchema);