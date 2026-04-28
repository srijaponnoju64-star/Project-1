const Volunteer = require('../models/Volunteer');
const Match = require('../models/Match');

function haversineDistance(c1, c2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(c2[1] - c1[1]);
  const dLon = toRad(c2[0] - c1[0]);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(c1[1])) * Math.cos(toRad(c2[1])) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function skillScore(vSkills, rSkills) {
  if (!rSkills || rSkills.length === 0) return 80;
  if (!vSkills || vSkills.length === 0) return 10;
  const v = vSkills.map(s => s.toLowerCase());
  const r = rSkills.map(s => s.toLowerCase());
  const matched = r.filter(skill => v.some(vs => vs.includes(skill) || skill.includes(vs))).length;
  return Math.round((matched / r.length) * 100);
}

function distanceScore(km, max) {
  if (km <= 2) return 100;
  if (km > max) return 0;
  return Math.round(((max - km) / max) * 100);
}

function availabilityScore(vol) {
  if (!vol.isAvailableNow) return 0;
  const a = vol.availability;
  if (a.fullTime) return 100;
  let s = 50;
  if (a.weekdays) s += 15;
  if (a.weekends) s += 15;
  if (a.mornings || a.afternoons || a.evenings) s += 20;
  return Math.min(s, 100);
}

function causeScore(causes, category) {
  if (!causes || causes.length === 0) return 50;
  if (causes.includes(category)) return 100;
  const groups = [['food','children','elderly'],['health','sanitation','disaster'],['education','children'],['shelter','disaster','transport']];
  for (const g of groups) {
    if (g.includes(category) && causes.some(c => g.includes(c))) return 60;
  }
  return 30;
}

async function findBestMatches(need, limit = 10) {
  try {
    const volunteers = await Volunteer.find({ isAvailableNow: true, isVerified: true }).populate('user', 'name email phone');
    const scored = [];
    for (const vol of volunteers) {
      if (!vol.location?.coordinates) continue;
      const km = haversineDistance(need.location.coordinates, vol.location.coordinates);
      if (km > (vol.maxDistanceKm || 50)) continue;
      const existing = await Match.findOne({ need: need._id, volunteer: vol._id, status: { $in: ['accepted','completed'] } });
      if (existing) continue;
      const ss = skillScore(vol.skills, need.requiredSkills);
      const ds = distanceScore(km, vol.maxDistanceKm || 50);
      const as = availabilityScore(vol);
      const cs = causeScore(vol.causes, need.category);
      const rs = vol.reliabilityScore || 70;
      const total = Math.round(ss*0.35 + as*0.20 + ds*0.20 + cs*0.15 + rs*0.10);
      scored.push({ volunteer: vol, compatibilityScore: total, skillScore: ss, distanceScore: ds, availabilityScore: as, causeAlignmentScore: cs, reliabilityScore: rs, distanceKm: Math.round(km*10)/10 });
    }
    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    return scored.slice(0, limit);
  } catch (e) {
    console.error('Matching error:', e);
    return [];
  }
}

async function createMatches(need, results) {
  const created = [];
  for (const r of results) {
    const exists = await Match.findOne({ need: need._id, volunteer: r.volunteer._id });
    if (exists) continue;
    const m = await Match.create({
      need: need._id, volunteer: r.volunteer._id, volunteerUser: r.volunteer.user._id, ngo: need.ngo,
      compatibilityScore: r.compatibilityScore, skillScore: r.skillScore, distanceScore: r.distanceScore,
      availabilityScore: r.availabilityScore, causeAlignmentScore: r.causeAlignmentScore,
      reliabilityScore: r.reliabilityScore, distanceKm: r.distanceKm, status: 'suggested',
    });
    created.push(m);
  }
  return created;
}

module.exports = { findBestMatches, createMatches, haversineDistance };