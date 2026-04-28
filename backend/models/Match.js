const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  need:          { type: mongoose.Schema.Types.ObjectId, ref: 'Need',      required: true },
  volunteer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  volunteerUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  ngo:           { type: mongoose.Schema.Types.ObjectId, ref: 'NGO',       required: true },
  compatibilityScore:  { type: Number, default: 0 },
  skillScore:          { type: Number, default: 0 },
  distanceScore:       { type: Number, default: 0 },
  availabilityScore:   { type: Number, default: 0 },
  causeAlignmentScore: { type: Number, default: 0 },
  reliabilityScore:    { type: Number, default: 0 },
  distanceKm:          { type: Number, default: 0 },
  status: { type: String, enum: ['suggested','notified','accepted','rejected','completed','cancelled'], default: 'suggested' },
  acceptedAt:        { type: Date },
  completedAt:       { type: Date },
  hoursSpent:        { type: Number, default: 0 },
  volunteerFeedback: { type: String, default: '' },
  rating:            { type: Number, min: 1, max: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);