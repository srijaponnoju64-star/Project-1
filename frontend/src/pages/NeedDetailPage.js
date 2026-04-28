import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNeed, runMatch, updateNeed } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NeedDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [need, setNeed]       = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getNeed(id).then(r => setNeed(r.data?.data || r.data)).catch(() => {}); }, [id]);

  const handleMatch = async () => {
    setLoading(true);
    try {
      const res = await runMatch(id);
      setMatches(res.data?.data || res.data || []);
      alert('✅ Matching complete! Top volunteers found.');
    } catch { alert('Matching failed'); }
    finally { setLoading(false); }
  };

  const handleComplete = async () => {
    await updateNeed(id, { status:'completed' });
    setNeed({ ...need, status:'completed' });
  };

  if (!need) return <div style={{ padding:40, color:'#666' }}>Loading...</div>;

  const urgencyColor = { critical:'#e53935', high:'#fb8c00', medium:'#fdd835', low:'#43a047' };

  return (
    <div style={{ maxWidth:800 }}>
      <button onClick={() => navigate('/needs')} style={{ background:'none', border:'none', color:'#1a237e', cursor:'pointer', marginBottom:16, fontSize:14 }}>
        ← Back to Needs
      </button>

      <div style={{ background:'#fff', padding:28, borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <h2 style={{ color:'#1a237e', flex:1 }}>{need.title}</h2>
          <span style={{ background:urgencyColor[need.urgencyLevel], color: need.urgencyLevel==='medium'?'#333':'#fff', padding:'4px 14px', borderRadius:12, fontWeight:'bold', fontSize:13 }}>
            {need.urgencyLevel?.toUpperCase()}
          </span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {[
            ['Category', need.category],
            ['Status', need.status],
            ['People Affected', need.peopleAffected],
            ['Volunteers Needed', `${need.volunteersAssigned}/${need.volunteersNeeded}`],
            ['Urgency Score', need.urgencyScore],
            ['Location', need.address],
          ].map(([label, val]) => (
            <div key={label} style={{ background:'#f8f9fa', padding:'10px 14px', borderRadius:8 }}>
              <div style={{ fontSize:12, color:'#666' }}>{label}</div>
              <div style={{ fontWeight:'bold', marginTop:2 }}>{val}</div>
            </div>
          ))}
        </div>

        <p style={{ color:'#555', lineHeight:1.7, marginBottom:16 }}>{need.description}</p>

        {need.requiredSkills?.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <strong>Required Skills:</strong>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
              {need.requiredSkills.map(s => (
                <span key={s} style={{ background:'#e8eaf6', color:'#1a237e', padding:'4px 12px', borderRadius:20, fontSize:13 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:12, marginTop:20 }}>
          {(user?.role === 'admin' || user?.role === 'ngo') && need.status !== 'completed' && (
            <>
              <button onClick={handleMatch} disabled={loading} style={{ padding:'10px 20px', background:'#1a237e', color:'#fff', border:'none', borderRadius:8, fontWeight:'bold' }}>
                {loading ? 'Matching...' : '🤝 Run Auto-Match'}
              </button>
              <button onClick={handleComplete} style={{ padding:'10px 20px', background:'#43a047', color:'#fff', border:'none', borderRadius:8, fontWeight:'bold' }}>
                ✅ Mark Complete
              </button>
            </>
          )}
        </div>
      </div>

      {matches.length > 0 && (
        <div style={{ background:'#fff', padding:24, borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color:'#1a237e', marginBottom:16 }}>🏆 Top Matched Volunteers</h3>
          {matches.map((m, i) => (
            <div key={m._id} style={{ padding:14, background:'#f8f9fa', borderRadius:8, marginBottom:10, borderLeft:`4px solid ${i===0?'#fdd835':i===1?'#bdbdbd':'#cd7f32'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <strong>#{i+1} Match Score: {m.compatibilityScore}%</strong>
                <span style={{ color:'#43a047' }}>{m.status}</span>
              </div>
              <div style={{ display:'flex', gap:16, marginTop:8, fontSize:13, color:'#666' }}>
                <span>🎯 Skills: {m.skillScore}%</span>
                <span>📍 Distance: {m.distanceKm}km</span>
                <span>⏰ Availability: {m.availabilityScore}%</span>
                <span>❤️ Cause: {m.causeAlignmentScore}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}