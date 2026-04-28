const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');
const Need = require('../models/Need');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const Problem = require('../models/Problem');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
  await Promise.all([User.deleteMany(), NGO.deleteMany(), Volunteer.deleteMany(), Need.deleteMany(), Match.deleteMany(), Notification.deleteMany(), Problem.deleteMany()]);
  console.log('🗑️  Cleared old data');

  // NGO Head
  const ngoHead = await User.create({ name: 'NGO Head Admin', email: 'ngohead@civicmatch.org', password: 'Head@123', role: 'ngo_head', isVerified: true, isActive: true });

  // NGO
  const ngo = await NGO.create({ user: ngoHead._id, organizationName: 'Helping Hands India', description: 'Community welfare NGO', focusAreas: ['food','health','education'], location: { type:'Point', coordinates:[78.4867, 17.3850] }, address: { city:'Hyderabad', state:'Telangana', country:'India' }, isVerified: true, contactEmail: 'contact@helpinghands.org' });

  // NGO Team Members
  const team1 = await User.create({ name: 'Health Team Lead', email: 'health@team.org', password: 'Team@123', role: 'ngo_team', isVerified: true, isActive: true, ngoId: ngo._id, teamName: 'Health & Medical Team' });
  const team2 = await User.create({ name: 'Food Team Lead', email: 'food@team.org', password: 'Team@123', role: 'ngo_team', isVerified: true, isActive: true, ngoId: ngo._id, teamName: 'Food & Nutrition Team' });

  // Volunteers
  const vol1 = await User.create({ name: 'Arjun Sharma', email: 'arjun@volunteer.com', password: 'Vol@123', role: 'volunteer', isVerified: true, isActive: true, volunteerStatus: 'approved' });
  const vol2 = await User.create({ name: 'Priya Nair', email: 'priya@volunteer.com', password: 'Vol@123', role: 'volunteer', isVerified: true, isActive: true, volunteerStatus: 'approved' });

  // Community Users
  const user1 = await User.create({ name: 'Ravi Kumar', email: 'ravi@user.com', password: 'User@123', role: 'user', isVerified: true, isActive: true });
  const user2 = await User.create({ name: 'Sneha Reddy', email: 'sneha@user.com', password: 'User@123', role: 'user', isVerified: true, isActive: true });

  console.log('👤 Users created');

  // Volunteer Profiles
  await Volunteer.create({ user: vol1._id, skills: ['first aid','medical'], causes: ['health'], isAvailableNow: true, reliabilityScore: 90, location: { type:'Point', coordinates:[78.48, 17.39] } });
  await Volunteer.create({ user: vol2._id, skills: ['teaching','cooking'], causes: ['food','education'], isAvailableNow: true, reliabilityScore: 85, location: { type:'Point', coordinates:[78.47, 17.41] } });

  // Community Problems
  await Problem.create([
    { postedBy: user1._id, title: 'No clean water in our area for 3 days', description: 'Our locality has been without clean drinking water for 3 days. Over 200 families are affected. Children and elderly are at risk.', category: 'sanitation', urgencyLevel: 'critical', location: 'Malkajgiri, Hyderabad', coordinates: { type:'Point', coordinates:[78.51, 17.46] }, address: 'Malkajgiri, Hyderabad', peopleAffected: 800, status: 'pending' },
    { postedBy: user2._id, title: 'Children need food supplies after flood', description: 'Flood affected 50 families. Children have not eaten for 2 days. Need urgent food and medical support.', category: 'food', urgencyLevel: 'critical', location: 'Amberpet, Hyderabad', coordinates: { type:'Point', coordinates:[78.53, 17.39] }, address: 'Amberpet, Hyderabad', peopleAffected: 200, status: 'analysed', aiUrgencyScore: 85, aiAnalysis: 'Critical food emergency. Immediate intervention required.', aiRecommendedTeam: 'Food & Nutrition Team', assignedNGO: ngo._id },
    { postedBy: user1._id, title: 'Elderly people need medical assistance', description: 'Group of elderly people in our colony need regular medical checkups and medicines.', category: 'health', urgencyLevel: 'high', location: 'Kukatpally, Hyderabad', coordinates: { type:'Point', coordinates:[78.41, 17.49] }, address: 'Kukatpally, Hyderabad', peopleAffected: 45, status: 'assigned', assignedNGO: ngo._id, assignedTeam: 'Health & Medical Team', progress: 30 },
  ]);

  console.log('📋 Problems created');
  console.log('\n✅ Seeding complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  NGO Head:   ngohead@civicmatch.org / Head@123');
  console.log('  NGO Team 1: health@team.org        / Team@123');
  console.log('  NGO Team 2: food@team.org           / Team@123');
  console.log('  Volunteer:  arjun@volunteer.com     / Vol@123');
  console.log('  User:       ravi@user.com            / User@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(0);
};

seed().catch(err => { console.error('❌ Seeder failed:', err.message); process.exit(1); });