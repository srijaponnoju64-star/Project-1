import React, { useEffect, useState } from 'react';
import { getAllNGOs, verifyNGO, getAllNeeds, approveNeed, getUsers, toggleUser, getAnalyticsOverview } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const [tab, setTab]     = useState('overview');
  const [ngos, setNgos]   = useState([]);
  const [needs, setNeeds] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAllNGOs().then(r => setNgos(r.data.ngos || [])).catch(() => {});
    getAllNeeds().then(r => setNeeds(r.data.needs || [])).catch(() => {});
    getUsers().then(r => setUsers(r.data.users || [])).catch(() => {});
    getAnalyticsOverview().then(r => setStats(r.data.stats)).catch(() => {});
  }, []);

  const handleVerify = async (id) => {
    try { await verifyNGO(id); setNgos(ngos.map(n => n._id === id ? { ...n, isVerified:true } : n)); alert('✅ NGO Verified!'); }
    catch { alert('Failed'); }
  };

  const handleApprove = async (id) => {
    try { await approveNeed(id); setNeeds(needs.map(n => n._id === id ? { ...n, status:'approved' } : n)); alert('✅ Need Approved & Matched!'); }
    catch { alert('Failed'); }
  };

  const handleToggle = async (id) => {
    try { await toggleUser(id); setUsers(users.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u)); }
    catch { alert('Failed'); }
  };

  const pendingNGOs  = ngos.filter(n => !n.isVerified);
  const pendingNeeds = needs.filter(n => n.status === 'pending');

  return (
    <div>
      <h2 style={{ color:'#1a237e', marginBottom:24 }}>⚙️ Admin Panel</h2>

      {(pendingNGOs.length > 0 || pendingNeeds.length > 0) && (
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          {pendingNGOs.length > 0 && <div style={{ padding:'12px 18px', background:'#fff8e1', borderRadius:10, border:'1px solid #fdd835', color:'#f57f17', fontWeight:'bold' }}>⚠️ {pendingNGOs.length} NGO(s) awaiting verification</div>}
          {pendingNeeds.length > 0 && <div style={{ padding:'12px 18px', background:'#ffebee', borderRadius:10, border:'1px solid #ef9a9a', color:'#c62828', fontWeight:'bold' }}>🔴 {pendingNeeds.length} Need(s) awaiting approval</div>}
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {['overview','ngos','needs','users'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'10px 18px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:'bold', background:tab===t?'#1a237e':'#fff', color:tab===t?'#fff':'#1a237e', boxShadow:'0 2px 6px rgba(0,0,0,0.08)' }}>
            {t === 'overview' ? '📊 Overview' : t === 'ngos' ? `🏢 NGOs (${ngos.length})` : t === 'needs' ? `📋 Needs (${needs.length})` : `👥 Users (${users.length})`}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {[['Total Needs', stats.totalNeeds, '#1a237e'],['Active', stats.activeNeeds, '#e53935'],['Completed', stats.completedNeeds, '#43a047'],['Volunteers', stats.totalVolunteers, '#6a1b9a'],['NGOs', stats.totalNGOs, '#00838f'],['People Helped', stats.peopleHelped, '#e65100']].map(([l, v, c]) => (
            <div key={l} style={{ background:'#fff', padding:'20px 24px', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', minWidth:140, borderLeft:`4px solid ${c}` }}>
              <div style={{ fontSize:28, fontWeight:'bold', color:c }}>{v ?? 0}</div>
              <div style={{ fontSize:13, color:'#666', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ngos' && (
        <div>
          {ngos.map(n => (
            <div key={n._id} style={{ background:'#fff', padding:16, borderRadius:10, marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:14, borderLeft:`4px solid ${n.isVerified?'#43a047':'#fdd835'}` }}>
              <div style={{ flex:1 }}>
                <strong>{n.organizationName}</strong>
                <p style={{ fontSize:13, color:'#666' }}>{n.user?.email} | Focus: {(n.focusAreas||[]).join(', ')}</p>
              </div>
              {n.isVerified
                ? <span style={{ color:'#43a047', fontWeight:'bold' }}>✅ Verified</span>
                : <button onClick={() => handleVerify(n._id)} style={{ padding:'8px 16px', background:'#1a237e', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:'bold' }}>Verify</button>
              }
            </div>
          ))}
        </div>
      )}

      {tab === 'needs' && (
        <div>
          {needs.map(n => (
            <div key={n._id} style={{ background:'#fff', padding:16, borderRadius:10, marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ flex:1 }}>
                <strong>{n.title}</strong>
                <p style={{ fontSize:13, color:'#666' }}>{n.category} | {n.urgencyLevel} | {n.status} | 👥 {n.peopleAffected}</p>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => navigate(`/needs/${n._id}`)} style={{ padding:'7px 14px', background:'#e8eaf6', color:'#1a237e', border:'none', borderRadius:8, cursor:'pointer' }}>View</button>
                {n.status === 'pending' && <button onClick={() => handleApprove(n._id)} style={{ padding:'7px 14px', background:'#1a237e', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:'bold' }}>Approve</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div>
          {users.map(u => (
            <div key={u._id} style={{ background:'#fff', padding:14, borderRadius:10, marginBottom:8, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'#1a237e', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' }}>
                {u.name?.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <strong>{u.name}</strong>
                <p style={{ fontSize:13, color:'#666' }}>{u.email} | {u.role}</p>
              </div>
              <span style={{ padding:'3px 12px', borderRadius:12, fontSize:12, fontWeight:'bold', background:u.isActive?'#e8f5e9':'#ffebee', color:u.isActive?'#43a047':'#e53935' }}>
                {u.isActive ? 'Active' : 'Inactive'}
              </span>
              {u.role !== 'admin' && (
                <button onClick={() => handleToggle(u._id)} style={{ padding:'7px 14px', background:u.isActive?'#ffebee':'#e8f5e9', color:u.isActive?'#e53935':'#43a047', border:'none', borderRadius:8, cursor:'pointer', fontWeight:'bold' }}>
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}