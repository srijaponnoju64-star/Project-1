const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Volunteer = require('../models/Volunteer');
const Match = require('../models/Match');

router.get('/my', protect, async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ user: req.user._id }).populate('user', 'name email phone committeeEmail');
    res.json({ success: true, volunteer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/my', protect, async (req, res) => {
  try {
    let vol = await Volunteer.findOne({ user: req.user._id });
    if (vol) {
      vol = await Volunteer.findOneAndUpdate({ user: req.user._id }, req.body, { new: true });
    } else {
      vol = await Volunteer.create({ ...req.body, user: req.user._id });
    }
    res.json({ success: true, volunteer: vol });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/matches', protect, async (req, res) => {
  try {
    const vol = await Volunteer.findOne({ user: req.user._id });
    if (!vol) return res.json({ success: true, matches: [] });
    const matches = await Match.find({ volunteer: vol._id }).populate('need');
    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const vols = await Volunteer.find().populate('user', 'name email');
    res.json({ success: true, data: vols });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;