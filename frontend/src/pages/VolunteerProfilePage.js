import React, { useEffect, useState } from 'react';
import { getVolunteerMe, createVolunteer, updateVolunteer } from '../services/api';

export default function VolunteerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bio:'', skills:'', causes:'', address:'', maxDistanceKm:25,
    experience:'beginner',
    availability:{ weekdays:false, weekends:true, mornings:false, afternoons:false, evenings:false, fullTime:false }
  });

  useEffect(() => {
    getVolunteerMe().then(r => {
      const p = r.data?.data || r.data;
      if (p) {
        setProfile(p);
        setForm({ ...form, bio:p.bio||'', skills:p.skills?.join(', ')||'', causes:p.causes?.join(', ')||'', address:p.address||'', maxDistanceKm:p.maxDistanceKm||25, experience:p.experience||'beginner', availability:p.availability||form.availability });
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, skills:form.skills.split(',').map(s=>s.trim()).filter(Boolean), causes:form.causes.split(',').map(s=>s.trim()).filter(Boolean), location:{ type:'Point', coordinates:[78.4867,17.3850] } };
      const res = profile ? await updateVolunteer(payload) : await createVolunteer(payload);
      setProfile(res.data?.data || res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    finally { setLoading(false); }
  };

  const toggleAvail = (key) => setForm({ ...form, availability:{ ...form.availability, [key]:!form.availability[key] } });

  return (
    <div style={{ maxWidth:600 }}>
      <h2 style={{ color:'#1a237e', marginBottom:24 }}>👤 Volunteer Profile</h2>
      {saved && <div style={{ background:'#e8f5e9', color:'#43a047', padding:12, borderRadius:8, marginBottom:16, fontWeight:'bold' }}>✅ Profile saved successfully!</div>}

      {profile && (
        <div style={{ background:'#e8eaf6', padding:16, borderRadius:10, marginBottom:20, display:'flex', gap:20 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:'bold', color:'#1a237e' }}>{profile.totalTasksCompleted}</div>
            <div style={{ fontSize:12, color:'#666' }}>Tasks Done</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:'bold', color:'#43a047' }}>{profile.totalHoursVolunteered}h</div>
            <div style={{ fontSize:12, color:'#666' }}>Hours Given</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:'bold', color:'#fb8c00' }}>{profile.impactPoints}</div>
            <div style={{ fontSize:12, color:'#666' }}>Impact Points</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:'bold', color:'#e53935' }}>{profile.reliabilityScore}%</div>
            <div style={{ fontSize:12, color:'#666' }}>Reliability</div>
          </div>
        </div>
      )}

      <div style={{ background:'#fff', padding:28, borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={labelStyle}>Bio</label>
            <textarea value={form.bio} onChange={e => setForm({...form, bio:e.target.value})} style={{...inputStyle,height:80}} placeholder="Tell us about yourself..." />
          </div>
          <div>
            <label style={labelStyle}>Skills (comma separated)</label>
            <input value={form.skills} onChange={e => setForm({...form, skills:e.target.value})} style={inputStyle} placeholder="e.g. first aid, teaching, driving" />
          </div>
          <div>
            <label style={labelStyle}>Causes you care about (comma separated)</label>
            <input value={form.causes} onChange={e => setForm({...form, causes:e.target.value})} style={inputStyle} placeholder="e.g. health, education, food" />
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <input value={form.address} onChange={e => setForm({...form, address:e.target.value})} style={inputStyle} placeholder="Your location" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Max Distance (km)</label>
              <input type="number" value={form.maxDistanceKm} onChange={e => setForm({...form, maxDistanceKm:+e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Experience Level</label>
              <select value={form.experience} onChange={e => setForm({...form, experience:e.target.value})} style={inputStyle}>
                {['beginner','intermediate','expert'].map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Availability</label>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8 }}>
              {Object.keys(form.availability).map(key => (
                <button key={key} type="button" onClick={() => toggleAvail(key)} style={{
                  padding:'8px 14px', borderRadius:20, border:'2px solid #1a237e', cursor:'pointer', fontSize:13,
                  background: form.availability[key] ? '#1a237e' : '#fff',
                  color: form.availability[key] ? '#fff' : '#1a237e'
                }}>
                  {key}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ padding:14, background:'#1a237e', color:'#fff', border:'none', borderRadius:8, fontWeight:'bold', fontSize:16 }}>
            {loading ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { fontSize:13, fontWeight:'bold', color:'#555', display:'block', marginBottom:6 };
const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:14, boxSizing:'border-box' };