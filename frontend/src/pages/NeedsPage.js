import React, { useEffect, useState } from 'react';
import { getNeeds } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NeedsPage() {
  const [needs, setNeeds]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('all');
  const [urgency, setUrgency]   = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    getNeeds().then(r => { const d = r.data.needs || []; setNeeds(d); setFiltered(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    let r = needs;
    if (search)             r = r.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'all') r = r.filter(n => n.category === category);
    if (urgency  !== 'all') r = r.filter(n => n.urgencyLevel === urgency);
    setFiltered(r);
  }, [search, category, urgency, needs]);

  const urgencyColor = { critical:'#e53935', high:'#fb8c00', medium:'#fdd835', low:'#43a047' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ color:'#1a237e' }}>📋 Community Needs</h2>
        {(user?.role === 'ngo' || user?.role === 'admin') && (
          <button onClick={() => navigate('/needs/create')} style={{ padding:'10px 20px', background:'#1a237e', color:'#fff', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer' }}>+ Report Need</button>
        )}
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'10px 14px', borderRadius:8, border:'1px solid #ddd', flex:1, minWidth:180 }} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding:'10px 12px', borderRadius:8, border:'1px solid #ddd', background:'#fff' }}>
          <option value="all">All Categories</option>
          {['food','health','education','shelter','sanitation','transport','elderly','children','disaster','other'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={urgency} onChange={e => setUrgency(e.target.value)} style={{ padding:'10px 12px', borderRadius:8, border:'1px solid #ddd', background:'#fff' }}>
          <option value="all">All Urgency</option>
          {['critical','high','medium','low'].map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <p style={{ color:'#666', marginBottom:12 }}>{filtered.length} needs found</p>

      {filtered.map(n => (
        <div key={n._id} onClick={() => navigate(`/needs/${n._id}`)}
          style={{ background:'#fff', padding:16, borderRadius:10, marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', cursor:'pointer', borderLeft:`4px solid ${urgencyColor[n.urgencyLevel]||'#999'}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <strong style={{ fontSize:15 }}>{n.title}</strong>
              <p style={{ color:'#666', fontSize:13, margin:'4px 0' }}>📍 {n.address} | 🏷️ {n.category}</p>
              <p style={{ fontSize:13, color:'#555' }}>👥 {n.peopleAffected} people | 🙋 {n.volunteersAssigned}/{n.volunteersNeeded} volunteers | Score: {n.urgencyScore}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginLeft:12, alignItems:'flex-end' }}>
              <span style={{ background:urgencyColor[n.urgencyLevel], color:n.urgencyLevel==='medium'?'#333':'#fff', padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:'bold' }}>
                {n.urgencyLevel?.toUpperCase()}
              </span>
              <span style={{ background:'#e8eaf6', color:'#1a237e', padding:'3px 10px', borderRadius:12, fontSize:12 }}>{n.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}