const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Match = require('../models/Match');
const Need = require('../models/Need');
const { findBestMatches, createMatches } = require('../utils/matchingEngine');

router.get('/', protect, async (req, res) => {
  try {
    const matches = await Match.find().populate('need').populate('volunteer');
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/run/:needId', protect, async (req, res) => {
  try {
    const need = await Need.findById(req.params.needId);
    if (!need) return res.status(404).json({ success: false, message: 'Need not found' });
    const results = await findBestMatches(need);
    const matches = await createMatches(need, results);
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/accept', protect, async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, { status: 'accepted', acceptedAt: new Date() }, { new: true });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/reject', protect, async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/complete', protect, async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, { status: 'completed', completedAt: new Date() }, { new: true });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;