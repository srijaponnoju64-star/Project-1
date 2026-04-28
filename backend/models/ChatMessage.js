const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  room:      { type: String, default: 'general' },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['text','notification','system'], default: 'text' },
  isRead:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatSchema);