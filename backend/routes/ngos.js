const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const NGO = require('../models/NGO');

router.get('/my', protect, async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    res.json({ success: true, data: ngo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/my', protect, async (req, res) => {
  try {
    let ngo = await NGO.findOne({ user: req.user._id });
    if (ngo) {
      ngo = await NGO.findOneAndUpdate({ user: req.user._id }, req.body, { new: true });
    } else {
      ngo = await NGO.create({ ...req.body, user: req.user._id });
    }
    res.json({ success: true, data: ngo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const ngos = await NGO.find().populate('user', 'name email');
    res.json({ success: true, data: ngos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const ngos = await NGO.find().populate('user', 'name email');
    res.json({ success: true, data: ngos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const ngo = await NGO.create({ ...req.body, user: req.user._id });
    res.json({ success: true, data: ngo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/verify', protect, async (req, res) => {
  try {
    const ngo = await NGO.findByIdAndUpdate(req.params.id, { isVerified: true, verifiedAt: new Date() }, { new: true });
    res.json({ success: true, data: ngo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;