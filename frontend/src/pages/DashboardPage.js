import React, { useEffect, useState } from 'react';
import { getNeeds, getAnalyticsOverview } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [needs, setNeeds] = useState([]);

  useEffect(() => {
    getAnalyticsOverview().then(r => setStats(r.data.stats)).catch(() => {});
    getNeeds().then(r => setNeeds(r.data.needs?.slice(0, 5) || [])).catch(() => {});
  }, []);

  const urgencyColor = { critical:'#e53935', high:'#fb8c00', medium:'#fdd835', low:'#43a047' };

  return (
    <div>
      <h2 style={{ marginBottom:4, color:'#1a237e' }}>Welcome, {user?.name} 👋</h2>
      <p style={{ color:'#666', marginBottom:24 }}>Role: <strong style={{ textTransform:'capitalize' }}>{user?.role}</strong></p>

      {stats && (
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:32 }}>
          {[
            ['📋', 'Total Needs',    stats.totalNeeds,      '#1a237e'],
            ['🔴', 'Active Needs',   stats.activeNeeds,     '#e53935'],
            ['✅', 'Completed',      stats.completedNeeds,  '#43a047'],
            ['🙋', 'Volunteers',     stats.totalVolunteers, '#1565c0'],
            ['🏢', 'NGOs',           stats.totalNGOs,       '#6a1b9a'],
            ['🤝', 'Total Matches',  stats.totalMatches,    '#00838f'],
            ['👥', 'People Helped',  stats.peopleHelped,    '#e65100'],
          ].map(([icon, label, val, color]) => (
            <div key={label} style={{ background:'#fff', padding:'20px 24px', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', minWidth:140, borderLeft:`4px solid ${color}` }}>
              <div style={{ fontSize:28, fontWeight:'bold', color }}>{val ?? 0}</div>
              <div style={{ fontSize:13, color:'#666', marginTop:4 }}>{icon} {label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <h3 style={{ color:'#1a237e' }}>🔴 Top Urgent Needs</h3>
        <button onClick={() => navigate('/needs')} style={{ background:'none', border:'none', color:'#1a237e', fontWeight:'bold', cursor:'pointer' }}>View All →</button>
      </div>

      {needs.length === 0 ? (
        <div style={{ background:'#fff', padding:32, borderRadius:12, textAlign:'center', color:'#666' }}>No active needs found.</div>
      ) : needs.map(n => (
        <div key={n._id} onClick={() => navigate(`/needs/${n._id}`)} style={{ background:'#fff', padding:16, borderRadius:10, marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', cursor:'pointer' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <strong style={{ fontSize:15 }}>{n.title}</strong>
              <p style={{ color:'#666', fontSize:13, margin:'4px 0' }}>📍 {n.address} — {n.category}</p>
              <p style={{ fontSize:13 }}>👥 {n.peopleAffected} affected | 🙋 {n.volunteersAssigned}/{n.volunteersNeeded} volunteers</p>
            </div>
            <span style={{ background:urgencyColor[n.urgencyLevel], color: n.urgencyLevel==='medium'?'#333':'#fff', padding:'3px 12px', borderRadius:12, fontSize:12, fontWeight:'bold', whiteSpace:'nowrap' }}>
              {n.urgencyLevel?.toUpperCase()}
            </span>
          </div>
        </div>
      ))}

      <div style={{ display:'flex', gap:12, marginTop:24, flexWrap:'wrap' }}>
        {user?.role === 'ngo' && <button onClick={() => navigate('/needs/create')} style={actionBtn}>+ Post New Need</button>}
        {user?.role === 'volunteer' && <button onClick={() => navigate('/matches')} style={actionBtn}>View My Matches</button>}
        {user?.role === 'admin' && <button onClick={() => navigate('/admin')} style={actionBtn}>Open Admin Panel</button>}
        <button onClick={() => navigate('/analytics')} style={{ ...actionBtn, background:'#43a047' }}>📊 View Analytics</button>
        <button onClick={() => navigate('/map')} style={{ ...actionBtn, background:'#1565c0' }}>🗺️ View Map</button>
      </div>
    </div>
  );
}

const actionBtn = { padding:'10px 20px', background:'#1a237e', color:'#fff', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer', fontSize:14 };