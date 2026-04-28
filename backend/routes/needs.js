const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Need = require('../models/Need');

router.get('/', async (req, res) => {
  try {
    const needs = await Need.find().populate('ngo').sort({ urgencyScore: -1 });
    res.json({ success: true, data: needs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const need = await Need.findById(req.params.id).populate('ngo');
    res.json({ success: true, data: need });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const need = await Need.create({ ...req.body, postedBy: req.user._id });
    res.json({ success: true, data: need });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const need = await Need.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: need });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;