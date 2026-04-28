const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bio:          { type: String, default: '' },
  skills:       [String],
  causes:       [String],
  availability: {
    weekdays: { type: Boolean, default: false },
    weekends: { type: Boolean, default: true },
    mornings: { type: Boolean, default: false },
    afternoons: { type: Boolean, default: false },
    evenings: { type: Boolean, default: false },
    fullTime: { type: Boolean, default: false }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [78.4867, 17.3850] }
  },
  address:               { type: String, default: '' },
  maxDistanceKm:         { type: Number, default: 25 },
  experience:            { type: String, enum: ['beginner','intermediate','expert'], default: 'beginner' },
  totalTasksCompleted:   { type: Number, default: 0 },
  totalHoursVolunteered: { type: Number, default: 0 },
  reliabilityScore:      { type: Number, default: 70 },
  impactPoints:          { type: Number, default: 0 },
  isAvailableNow:        { type: Boolean, default: true },
  isVerified:            { type: Boolean, default: false },
  profilePicture:        { type: String, default: '' },
  currentTask:           { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }
}, { timestamps: true });

volunteerSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Volunteer', volunteerSchema);