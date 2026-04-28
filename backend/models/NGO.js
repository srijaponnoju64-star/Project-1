const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationName: { type: String, required: true, trim: true },
  description:      { type: String, default: '' },
  website:          { type: String, default: '' },
  focusAreas:       [{ type: String }],
  address:          { city: String, state: String, country: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [78.4867, 17.3850] }
  },
  isVerified:          { type: Boolean, default: false },
  verifiedAt:          { type: Date },
  totalNeedsPosted:    { type: Number, default: 0 },
  totalNeedsFulfilled: { type: Number, default: 0 },
  contactEmail:        { type: String, default: '' },
  contactPhone:        { type: String, default: '' },
  teams: [{ type: String }],
  committeeEmailDomain: { type: String, default: 'civicmatch.org' }
}, { timestamps: true });

ngoSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('NGO', ngoSchema);