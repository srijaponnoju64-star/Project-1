const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');
const { protect } = require('../middleware/auth');

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, organizationName, teamName, phone, ngoId } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const userData = { name, email, password, role: role || 'user', phone: phone || '' };

    if (role === 'ngo_team') {
      userData.ngoId = ngoId;
      userData.teamName = teamName || '';
      userData.isVerified = false;
      userData.isActive = true;
    }
    if (role === 'volunteer') {
      userData.volunteerStatus = 'pending';
      userData.isVerified = false;
      userData.isActive = true;
    }
    if (role === 'user' || role === 'ngo_head') {
      userData.isVerified = true;
      userData.isActive = true;
    }

    const user = await User.create(userData);

    if (role === 'ngo_head') {
      await NGO.create({
        user: user._id,
        organizationName: organizationName || name + "'s NGO",
        isVerified: true,
        contactEmail: email,
        committeeEmailDomain: 'civicmatch.org'
      });
    }

    if (role === 'volunteer') {
      await Volunteer.create({ user: user._id, isVerified: false });
    }

    if (role === 'ngo_team' || role === 'volunteer') {
      return res.status(201).json({ success: true, message: 'Registration submitted. Awaiting NGO Head approval.' });
    }

    const token = genToken(user._id);
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive)
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact NGO Head.' });
    if (!user.isVerified && (user.role === 'ngo_team' || user.role === 'volunteer'))
      return res.status(401).json({ success: false, message: 'Your account is pending approval from NGO Head.' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = genToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, ngoId: user.ngoId, teamName: user.teamName, committeeEmail: user.committeeEmail } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;