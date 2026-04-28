const express = require('express');
const router = express.Router();
const User = require('../models/User');
const NGO = require('../models/NGO');
const { protect, authorize } = require('../middleware/auth');

router.get('/team-members', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    const members = await User.find({ ngoId: ngo?._id, role: { $in: ['ngo_team', 'volunteer'] } }).select('-password');
    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/pending-volunteers', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer', volunteerStatus: 'pending' }).select('-password');
    res.json({ success: true, volunteers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/pending-team', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    const members = await User.find({ role: 'ngo_team', ngoId: ngo?._id, isVerified: false }).select('-password');
    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/approve-team', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    const memberCount = await User.countDocuments({ ngoId: ngo._id, role: 'ngo_team', isVerified: true });
    const committeeEmail = `team${memberCount + 1}@civicmatch.org`;
    const user = await User.findByIdAndUpdate(req.params.id,
      { isVerified: true, isActive: true, ngoId: ngo._id, committeeEmail },
      { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/approve-volunteer', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    const volCount = await User.countDocuments({ ngoId: ngo._id, role: 'volunteer', isVerified: true });
    const committeeEmail = `volunteer${volCount + 1}@civicmatch.org`;
    const user = await User.findByIdAndUpdate(req.params.id,
      { volunteerStatus: 'approved', isVerified: true, ngoId: ngo._id, committeeEmail },
      { new: true }).select('-password');
    const Volunteer = require('../models/Volunteer');
    await Volunteer.findOneAndUpdate({ user: req.params.id }, { isVerified: true });
    res.json({ success: true, user, committeeEmail });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/reject-volunteer', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,
      { volunteerStatus: 'rejected', isActive: false }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/toggle', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;