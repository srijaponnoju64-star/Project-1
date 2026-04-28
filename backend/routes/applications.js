const express = require('express');
const router = express.Router();
const VolunteerApplication = require('../models/VolunteerApplication');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Volunteer submits application
router.post('/', protect, authorize('volunteer'), async (req, res) => {
  try {
    const existing = await VolunteerApplication.findOne({ volunteer: req.user._id, status: 'pending' });
    if (existing) return res.status(400).json({ success: false, message: 'You already have a pending application' });
    const app = await VolunteerApplication.create({ ...req.body, volunteer: req.user._id, email: req.user.email, name: req.user.name });
    // Notify all NGO heads
    const ngoHeads = await User.find({ role: 'ngo_head', isActive: true });
    for (const head of ngoHeads) {
      await Notification.create({ recipient: head._id, type: 'general', title: '🙋 New Volunteer Application', message: req.user.name + ' has submitted a volunteer application. Review it in the portal.' });
      req.io.to(head._id.toString()).emit('notification', { type: 'new_application' });
    }
    res.status(201).json({ success: true, application: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Volunteer gets their own applications
router.get('/my', protect, authorize('volunteer'), async (req, res) => {
  try {
    const apps = await VolunteerApplication.find({ volunteer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, applications: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// NGO Head gets all applications
router.get('/all', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const apps = await VolunteerApplication.find().populate('volunteer', 'name email phone').sort({ createdAt: -1 });
    res.json({ success: true, applications: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// NGO Head runs AI analysis on application
router.put('/:id/analyse', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const app = await VolunteerApplication.findById(req.params.id).populate('volunteer', 'name email');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    let score = 50;
    const text = (app.whyJoin + ' ' + app.skills + ' ' + app.experience).toLowerCase();
    const positiveWords = ['experience','help','community','passionate','dedicated','volunteer','skill','care','support','service','years','trained','certified'];
    const negativeWords = ['money','salary','paid','benefit','free','nothing','bored'];
    positiveWords.forEach(w => { if (text.includes(w)) score += 5; });
    negativeWords.forEach(w => { if (text.includes(w)) score -= 10; });
    if (app.skills?.split(',').length >= 3) score += 10;
    if (app.experience?.length > 50) score += 10;
    if (app.whyJoin?.length > 100) score += 10;
    score = Math.max(0, Math.min(100, score));

    const aiDecision = score >= 65 ? 'recommended' : 'not_recommended';
    const aiSummary = 'AI Application Review:\n• Applicant: ' + app.name + '\n• AI Score: ' + score + '/100\n• Decision: ' + (aiDecision === 'recommended' ? 'RECOMMENDED ✅' : 'NOT RECOMMENDED ❌') + '\n• Skills mentioned: ' + (app.skills || 'None') + '\n• Experience: ' + (app.experience?.slice(0, 100) || 'Not provided') + '\n• Motivation score: ' + (app.whyJoin?.length > 100 ? 'Strong' : 'Needs improvement') + '\n• Availability: ' + (app.availability || 'Not specified') + '\n• Area: ' + (app.area || 'Not specified') + '\n• Recommendation: ' + (score >= 65 ? 'Approve this volunteer — shows genuine interest and relevant skills.' : 'Review carefully — application lacks depth or raises concerns.');

    app.aiScore = score;
    app.aiSummary = aiSummary;
    app.aiDecision = aiDecision;
    await app.save();

    res.json({ success: true, application: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// NGO Head approves or rejects application
router.put('/:id/decide', protect, authorize('ngo_head'), async (req, res) => {
  try {
    const { decision, response } = req.body;
    const app = await VolunteerApplication.findByIdAndUpdate(req.params.id, {
      status: decision,
      ngoResponse: response,
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
    }, { new: true }).populate('volunteer', 'name email');

    // Update user verification
    await User.findByIdAndUpdate(app.volunteer._id, {
      isVerified: decision === 'approved',
      volunteerStatus: decision,
    });

    // Notify volunteer
    const title = decision === 'approved' ? '🎉 Application Approved!' : '❌ Application Update';
    const message = decision === 'approved'
      ? 'Congratulations! Your volunteer application has been approved. You can now accept tasks from the NGO.'
      : 'Your volunteer application has been reviewed. Response: ' + response;

    await Notification.create({ recipient: app.volunteer._id, type: 'general', title, message });
    req.io.to(app.volunteer._id.toString()).emit('notification', { type: 'application_decision', decision, message });

    res.json({ success: true, application: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;