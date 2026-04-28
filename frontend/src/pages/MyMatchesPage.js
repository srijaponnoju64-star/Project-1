import React, { useEffect, useState } from 'react';
import { getMatches, updateMatch } from '../services/api';

export default function MyMatchesPage() {
  const [matches, setMatches] = useState([]);

  useEffect(() => { getMatches().then(r => setMatches(r.data?.data || r.data || [])).catch(() => {}); }, []);

  const handleStatus = async (id, status) => {
    try {
      const res = await updateMatch(id, { status });
      setMatches(matches.map(m => m._id === id ? (res.data?.data || res.data) : m));
    } catch { alert('Update failed'); }
  };

  const scoreColor = s => s >= 80 ? '#43a047' : s >= 60 ? '#fb8c00' : '#e53935';

  return (
    <div>
      <h2 style={{ color:'#1a237e', marginBottom:24 }}>🤝 My Matches</h2>
      {matches.length === 0 ? (
        <div style={{ background:'#fff', padding:40, borderRadius:12, textAlign:'center', color:'#666' }}>
          No matches yet. Matches will appear here when an admin runs the matching algorithm.
        </div>
      ) : matches.map(m => (
        <div key={m._id} style={{ background:'#fff', padding:20, borderRadius:12, marginBottom:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <strong style={{ fontSize:16 }}>{m.need?.title || 'Need'}</strong>
              <p style={{ color:'#666', fontSize:13, margin:'4px 0' }}>{m.need?.address} — {m.need?.category}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
              <span style={{ fontSize:24, fontWeight:'bold', color:scoreColor(m.compatibilityScore) }}>
                {m.compatibilityScore}%
              </span>
              <span style={{ fontSize:12, color:'#666' }}>match score</span>
            </div>
          </div>

          <div style={{ display:'flex', gap:16, margin:'12px 0', fontSize:13, color:'#555', flexWrap:'wrap' }}>
            <span>🎯 Skills: {m.skillScore}%</span>
            <span>📍 {m.distanceKm}km away</span>
            <span>⏰ Availability: {m.availabilityScore}%</span>
            <span>❤️ Cause: {m.causeAlignmentScore}%</span>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ padding:'4px 14px', borderRadius:12, fontSize:13, fontWeight:'bold',
              background: m.status==='accepted'?'#e8f5e9':m.status==='rejected'?'#ffebee':m.status==='completed'?'#e3f2fd':'#fff8e1',
              color: m.status==='accepted'?'#43a047':m.status==='rejected'?'#e53935':m.status==='completed'?'#1565c0':'#f57f17'
            }}>
              {m.status?.toUpperCase()}
            </span>
            <div style={{ display:'flex', gap:8 }}>
              {m.status === 'suggested' && (
                <>
                  <button onClick={() => handleStatus(m._id, 'accepted')}  style={{ padding:'8px 16px', background:'#43a047', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>✅ Accept</button>
                  <button onClick={() => handleStatus(m._id, 'rejected')}  style={{ padding:'8px 16px', background:'#e53935', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>❌ Decline</button>
                </>
              )}
              {m.status === 'accepted' && (
                <button onClick={() => handleStatus(m._id, 'completed')} style={{ padding:'8px 16px', background:'#1565c0', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>🏁 Mark Complete</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}