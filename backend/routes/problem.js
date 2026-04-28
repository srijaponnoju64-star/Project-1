const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// User posts a problem
router.post('/', protect, authorize('user'), async (req, res) => {
  try {
    const problem = await Problem.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User sees only their own problems
router.get('/my', protect, authorize('user'), async (req, res) => {
  try {
    const problems = await Problem.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// NGO Head sees ALL problems
router.get('/all', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const problems = await Problem.find().populate('postedBy', 'name email phone').sort({ createdAt: -1 });
    res.json({ success: true, problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// NGO Team sees only problems assigned to their team
router.get('/team', protect, authorize('ngo_team'), async (req, res) => {
  try {
    const problems = await Problem.find({ assignedTeam: req.user.teamName, assignedNGO: req.user.ngoId })
      .populate('postedBy', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// NGO Head: AI Analyse a problem
router.put('/:id/analyse', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    // AI Analysis logic
    let urgencyScore = 0;
    const urgencyMap = { critical: 40, high: 30, medium: 20, low: 10 };
    urgencyScore += urgencyMap[problem.urgencyLevel] || 20;
    if (problem.peopleAffected >= 500) urgencyScore += 30;
    else if (problem.peopleAffected >= 100) urgencyScore += 20;
    else if (problem.peopleAffected >= 50) urgencyScore += 15;
    else if (problem.peopleAffected >= 10) urgencyScore += 10;
    else urgencyScore += 5;

    // Recommend team based on category
    const teamMap = {
      food: 'Food & Nutrition Team',
      health: 'Health & Medical Team',
      education: 'Education Team',
      shelter: 'Shelter & Housing Team',
      sanitation: 'Sanitation Team',
      transport: 'Transport Team',
      elderly: 'Elder Care Team',
      children: 'Child Welfare Team',
      disaster: 'Disaster Response Team',
      other: 'General Team',
    };

    const aiAnalysis = `Problem Analysis Report:
- Category: ${problem.category.toUpperCase()}
- Urgency Score: ${Math.min(urgencyScore, 100)}/100
- People Affected: ${problem.peopleAffected}
- Priority Level: ${problem.urgencyLevel.toUpperCase()}
- Recommended Team: ${teamMap[problem.category] || 'General Team'}
- Action Required: ${urgencyScore >= 60 ? 'IMMEDIATE ACTION NEEDED' : urgencyScore >= 40 ? 'ACTION WITHIN 48 HOURS' : 'SCHEDULE FOR RESOLUTION'}
- Analysis: This problem requires ${problem.category} intervention. Based on the number of people affected (${problem.peopleAffected}) and urgency level (${problem.urgencyLevel}), this has been scored ${Math.min(urgencyScore, 100)}/100.`;

    problem.aiAnalysis = aiAnalysis;
    problem.aiUrgencyScore = Math.min(urgencyScore, 100);
    problem.aiRecommendedTeam = teamMap[problem.category] || 'General Team';
    problem.status = 'analysed';
    await problem.save();

    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// NGO Head: Assign problem to team
router.put('/:id/assign', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const { teamName, assignedTo, ngoId } = req.body;
    const problem = await Problem.findByIdAndUpdate(req.params.id, {
      assignedTeam: teamName,
      assignedTo: assignedTo || [],
      assignedNGO: ngoId,
      assignedAt: new Date(),
      status: 'assigned',
    }, { new: true }).populate('postedBy', 'name email');
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// NGO Team: Update progress
router.put('/:id/progress', protect, authorize('ngo_team'), async (req, res) => {
  try {
    const { progress, message } = req.body;
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ success: false, message: 'Not found' });
    problem.progress = progress;
    if (progress === 100) { problem.status = 'resolved'; problem.resolvedAt = new Date(); }
    else problem.status = 'in_progress';
    problem.updates.push({ message, updatedBy: req.user._id, updatedAt: new Date() });
    await problem.save();
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single problem — user can only see their own
router.get('/:id', protect, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('postedBy', 'name email')
      .populate('assignedTo', 'name email');
    if (!problem) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user.role === 'user' && problem.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Analytics for NGO Head
router.get('/analytics/summary', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const total     = await Problem.countDocuments();
    const pending   = await Problem.countDocuments({ status: 'pending' });
    const analysed  = await Problem.countDocuments({ status: 'analysed' });
    const assigned  = await Problem.countDocuments({ status: 'assigned' });
    const inProgress= await Problem.countDocuments({ status: 'in_progress' });
    const resolved  = await Problem.countDocuments({ status: 'resolved' });
    const byCategory = await Problem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    res.json({ success: true, data: { total, pending, analysed, assigned, inProgress, resolved, byCategory } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;