const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Problem = require('../models/Problem');
const { protect, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', protect, authorize('user'), upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const problem = await Problem.create({ ...req.body, postedBy: req.user._id, images });
    if (req.io) req.io.emit('new_problem', problem);
    res.status(201).json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my', protect, authorize('user'), async (req, res) => {
  try {
    const problems = await Problem.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics/summary', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const total      = await Problem.countDocuments();
    const pending    = await Problem.countDocuments({ status: 'pending' });
    const analysed   = await Problem.countDocuments({ status: 'analysed' });
    const assigned   = await Problem.countDocuments({ status: 'assigned' });
    const inProgress = await Problem.countDocuments({ status: 'in_progress' });
    const resolved   = await Problem.countDocuments({ status: 'resolved' });
    const byCategory = await Problem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    res.json({ success: true, data: { total, pending, analysed, assigned, inProgress, resolved, byCategory } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/all', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const { search, status, category, urgency } = req.query;
    let query = {};
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { location: { $regex: search, $options: 'i' } }];
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (urgency && urgency !== 'all') query.urgencyLevel = urgency;
    const problems = await Problem.find(query).populate('postedBy', 'name email phone').sort({ createdAt: -1 });
    res.json({ success: true, problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/team', protect, authorize('ngo_team'), async (req, res) => {
  try {
    const problems = await Problem.find({ assignedTeam: req.user.teamName })
      .populate('postedBy', 'name email phone').sort({ createdAt: -1 });
    res.json({ success: true, problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/analyse', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });
    const urgencyMap = { critical: 40, high: 30, medium: 20, low: 10 };
    let score = urgencyMap[problem.urgencyLevel] || 20;
    if (problem.peopleAffected >= 500) score += 30;
    else if (problem.peopleAffected >= 100) score += 20;
    else if (problem.peopleAffected >= 50) score += 15;
    else if (problem.peopleAffected >= 10) score += 10;
    else score += 5;
    const teamMap = { food:'Food & Nutrition Team', health:'Health & Medical Team', education:'Education Team', shelter:'Shelter & Housing Team', sanitation:'Sanitation Team', transport:'Transport Team', elderly:'Elder Care Team', children:'Child Welfare Team', disaster:'Disaster Response Team', environment:'Environment Team', water:'Water & Sanitation Team', electricity:'Infrastructure Team', roads:'Roads & Transport Team', crime:'Safety Team', other:'General Team' };
    const finalScore = Math.min(score, 100);
    const aiAnalysis = `🤖 AI ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Category: ${problem.category.toUpperCase()}
⚡ Urgency Score: ${finalScore}/100
👥 People Affected: ${problem.peopleAffected}
🎯 Priority: ${problem.urgencyLevel.toUpperCase()}
👥 Recommended Team: ${teamMap[problem.category] || 'General Team'}
🚨 Action Required: ${finalScore >= 60 ? 'IMMEDIATE ACTION NEEDED' : finalScore >= 40 ? 'ACTION WITHIN 48 HOURS' : 'SCHEDULE FOR RESOLUTION'}
📍 Location: ${problem.location}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    problem.aiAnalysis = aiAnalysis;
    problem.aiUrgencyScore = finalScore;
    problem.aiRecommendedTeam = teamMap[problem.category] || 'General Team';
    problem.status = 'analysed';
    problem.history.push({ action: 'AI Analysis Completed', doneBy: req.user._id, note: `Score: ${finalScore}/100` });
    await problem.save();
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/assign', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const { teamName, ngoId } = req.body;
    const problem = await Problem.findByIdAndUpdate(req.params.id,
      { assignedTeam: teamName, assignedNGO: ngoId, assignedAt: new Date(), status: 'assigned',
        $push: { history: { action: `Assigned to ${teamName}`, doneBy: req.user._id } } },
      { new: true }).populate('postedBy', 'name email');
    if (req.io) req.io.to(problem.postedBy._id.toString()).emit('problem_assigned', { problemId: problem._id, team: teamName });
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/progress', protect, authorize('ngo_team'), async (req, res) => {
  try {
    const { progress, message, hoursSpent } = req.body;
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ success: false, message: 'Not found' });
    problem.progress = progress;
    problem.status = progress === 100 ? 'resolved' : 'in_progress';
    if (progress === 100) problem.resolvedAt = new Date();
    if (message) problem.updates.push({ message, updatedBy: req.user._id, updatedAt: new Date() });
    problem.history.push({ action: `Progress updated to ${progress}%`, doneBy: req.user._id, note: message });
    await problem.save();
    const User = require('../models/User');
    if (hoursSpent) await User.findByIdAndUpdate(req.user._id, { $inc: { hoursVolunteered: hoursSpent } });
    if (progress === 100) await User.findByIdAndUpdate(req.user._id, { $inc: { tasksCompleted: 1 } });
    if (req.io) req.io.to(problem.postedBy.toString()).emit('problem_updated', { problemId: problem._id, progress, status: problem.status });
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const problem = await Problem.findByIdAndUpdate(req.params.id,
      { $push: { comments: { text, postedBy: req.user._id, role: req.user.role, postedAt: new Date() } } },
      { new: true }).populate('comments.postedBy', 'name role');
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('postedBy', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('comments.postedBy', 'name role')
      .populate('updates.updatedBy', 'name role');
    if (!problem) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user.role === 'user' && problem.postedBy._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;