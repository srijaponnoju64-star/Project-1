const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6 },
  role:       { type: String, enum: ['ngo_head', 'ngo_team', 'volunteer', 'user'], default: 'user' },
  phone:      { type: String, default: '' },
  avatar:     { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
  lastLogin:  { type: Date },
  ngoId:      { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
  teamName:   { type: String, default: '' },
  committeeEmail: { type: String, default: '' },
  volunteerStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  skills:     [String],
  bio:        { type: String, default: '' },
  hoursVolunteered: { type: Number, default: 0 },
  tasksCompleted:   { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);