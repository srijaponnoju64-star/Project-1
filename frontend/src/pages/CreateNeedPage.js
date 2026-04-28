import React, { useState } from 'react';
import { createNeed, getNGOMe } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function CreateNeedPage() {
  const navigate = useNavigate();
  const [ngo, setNgo]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({
    title:'', description:'', category:'food', urgencyLevel:'medium',
    volunteersNeeded:1, peopleAffected:0, address:'', requiredSkills:''
  });

  useEffect(() => { getNGOMe().then(r => setNgo(r.data?.data || r.data)).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ngo) return alert('You need an NGO profile first. Go to NGO Profile page.');
    setLoading(true);
    try {
      await createNeed({
        ...form,
        ngo: ngo._id,
        requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        location: { type:'Point', coordinates:[78.4867, 17.3850] }
      });
      navigate('/needs');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create need');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth:600 }}>
      <h2 style={{ color:'#1a237e', marginBottom:24 }}>📋 Report Community Need</h2>
      <div style={{ background:'#fff', padding:28, borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={labelStyle}>Need Title *</label>
            <input value={form.title} onChange={e => setForm({...form, title:e.target.value})} style={inputStyle} placeholder="e.g. Emergency Food Kits for Flood Families" required />
          </div>
          <div>
            <label style={labelStyle}>Description *</label>
            <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} style={{...inputStyle, height:100}} placeholder="Describe the situation in detail..." required />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category:e.target.value})} style={inputStyle}>
                {['food','health','education','shelter','sanitation','transport','elderly','children','disaster','other'].map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Urgency Level</label>
              <select value={form.urgencyLevel} onChange={e => setForm({...form, urgencyLevel:e.target.value})} style={inputStyle}>
                {['critical','high','medium','low'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Volunteers Needed</label>
              <input type="number" min="1" value={form.volunteersNeeded} onChange={e => setForm({...form, volunteersNeeded:+e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>People Affected</label>
              <input type="number" min="0" value={form.peopleAffected} onChange={e => setForm({...form, peopleAffected:+e.target.value})} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Location / Address</label>
            <input value={form.address} onChange={e => setForm({...form, address:e.target.value})} style={inputStyle} placeholder="e.g. Malkajgiri, Hyderabad" />
          </div>
          <div>
            <label style={labelStyle}>Required Skills (comma separated)</label>
            <input value={form.requiredSkills} onChange={e => setForm({...form, requiredSkills:e.target.value})} style={inputStyle} placeholder="e.g. driving, first aid, teaching" />
          </div>
          <button type="submit" disabled={loading} style={{ padding:14, background:'#1a237e', color:'#fff', border:'none', borderRadius:8, fontWeight:'bold', fontSize:16 }}>
            {loading ? 'Submitting...' : 'Submit Need'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { fontSize:13, fontWeight:'bold', color:'#555', display:'block', marginBottom:6 };
const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:14, boxSizing:'border-box' };