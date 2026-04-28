import React, { useEffect, useState } from 'react';
import { getNGOMe, createNGO } from '../services/api';

export default function NGOProfilePage() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ organizationName:'', description:'', contactEmail:'', contactPhone:'', city:'', state:'', country:'India', focusAreas:[] });

  useEffect(() => {
    getNGOMe().then(r => { const p = r.data?.data || r.data; if(p) setProfile(p); }).catch(() => {});
  }, []);

  const toggleFocus = (area) => {
    setForm({ ...form, focusAreas: form.focusAreas.includes(area) ? form.focusAreas.filter(a=>a!==area) : [...form.focusAreas, area] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createNGO({ ...form, address:{ city:form.city, state:form.state, country:form.country }, location:{ type:'Point', coordinates:[78.4867,17.3850] } });
      setProfile(res.data?.data || res.data);
      setSaved(true);
    } catch (err) { alert(err.response?.data?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  if (profile) return (
    <div style={{ maxWidth:600 }}>
      <h2 style={{ color:'#1a237e', marginBottom:24 }}>🏢 NGO Profile</h2>
      <div style={{ background:'#fff', padding:28, borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
        <h3>{profile.organizationName}</h3>
        <p style={{ color:'#666', margin:'8px 0' }}>{profile.description}</p>
        <p><strong>Status:</strong> {profile.isVerified ? '✅ Verified' : '⏳ Pending Verification'}</p>
        <p><strong>Focus Areas:</strong> {profile.focusAreas?.join(', ')}</p>
        <p><strong>Needs Posted:</strong> {profile.totalNeedsPosted} | <strong>Fulfilled:</strong> {profile.totalNeedsFulfilled}</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:600 }}>
      <h2 style={{ color:'#1a237e', marginBottom:24 }}>🏢 Register Your NGO</h2>
      {saved && <div style={{ background:'#e8f5e9', color:'#43a047', padding:12, borderRadius:8, marginBottom:16 }}>✅ NGO registered! Awaiting admin verification.</div>}
      <div style={{ background:'#fff', padding:28, borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={labelStyle}>Organization Name *</label>
            <input value={form.organizationName} onChange={e=>setForm({...form,organizationName:e.target.value})} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{...inputStyle,height:80}} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={e=>setForm({...form,contactEmail:e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact Phone</label>
              <input value={form.contactPhone} onChange={e=>setForm({...form,contactPhone:e.target.value})} style={inputStyle} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>City</label>
              <input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input value={form.state} onChange={e=>setForm({...form,state:e.target.value})} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Focus Areas</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
              {['food','health','education','shelter','sanitation','transport','elderly','children','disaster','other'].map(area => (
                <button key={area} type="button" onClick={() => toggleFocus(area)} style={{
                  padding:'8px 14px', borderRadius:20, border:'2px solid #1a237e', cursor:'pointer', fontSize:13,
                  background: form.focusAreas.includes(area) ? '#1a237e' : '#fff',
                  color: form.focusAreas.includes(area) ? '#fff' : '#1a237e'
                }}>
                  {area}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ padding:14, background:'#1a237e', color:'#fff', border:'none', borderRadius:8, fontWeight:'bold', fontSize:16 }}>
            {loading ? 'Registering...' : 'Register NGO'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { fontSize:13, fontWeight:'bold', color:'#555', display:'block', marginBottom:6 };
const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:14, boxSizing:'border-box' };