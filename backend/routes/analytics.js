const express = require('express');
const router = express.Router();
const Need = require('../models/Need');
const Match = require('../models/Match');
const Volunteer = require('../models/Volunteer');
const NGO = require('../models/NGO');
const Problem = require('../models/Problem');
const User = require('../models/User');

router.get('/overview', async (req, res) => {
  try {
    const totalNeeds      = await Need.countDocuments();
    const activeNeeds     = await Need.countDocuments({ status: { $in: ['active','approved','pending'] } });
    const completedNeeds  = await Need.countDocuments({ status: 'completed' });
    const totalVolunteers = await Volunteer.countDocuments();
    const totalNGOs       = await NGO.countDocuments();
    const totalMatches    = await Match.countDocuments();
    const totalProblems   = await Problem.countDocuments();
    const resolvedProblems= await Problem.countDocuments({ status: 'resolved' });
    const totalUsers      = await User.countDocuments({ role: 'user' });
    res.json({ success: true, stats: { totalNeeds, activeNeeds, completedNeeds, totalVolunteers, totalNGOs, totalMatches, totalProblems, resolvedProblems, totalUsers, peopleHelped: 1500 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/needs-by-category', async (req, res) => {
  try {
    const data = await Problem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const totalNeeds      = await Need.countDocuments();
    const openNeeds       = await Need.countDocuments({ status: { $in: ['active','approved','pending'] } });
    const completedNeeds  = await Need.countDocuments({ status: 'completed' });
    const totalVolunteers = await Volunteer.countDocuments();
    const totalNGOs       = await NGO.countDocuments();
    const totalMatches    = await Match.countDocuments();
    const byCategory      = await Problem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    res.json({ success: true, totalNeeds, openNeeds, completedNeeds, totalVolunteers, totalNGOs, totalMatches, byCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;