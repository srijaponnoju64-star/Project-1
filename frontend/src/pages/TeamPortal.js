import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTeamProblems, updateProgress } from '../services/api';

const STATUS_COLOR = { pending:'#f59e0b', analysed:'#3b82f6', assigned:'#8b5cf6', in_progress:'#10b981', resolved:'#22c55e' };

export default function TeamPortal() {
  const { user, logout, notifications, unreadCount, clearUnread } = useAuth();
  const [problems, setProblems]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [progressForm, setProgressForm] = useState({ progress:0, message:'' });
  const [loading, setLoading]     = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [tab, setTab]             = useState('problems');

  useEffect(() => { loadProblems(); }, []);

  useEffect(() => {
    const handler = (e) => {
      const { problemId, status, progress } = e.detail;
      setProblems(prev => prev.map(p => p._id === problemId ? { ...p, status, progress } : p));
    };
    window.addEventListener('problem_updated', handler);
    return () => window.removeEventListener('problem_updated', handler);
  }, []);

  const loadProblems = async () => {
    try { const res = await getTeamProblems(); setProblems(res.data.problems || []); } catch {}
  };

  const handleProgress = async (id) => {
    setLoading(true);
    try {
      await updateProgress(id, progressForm);
      alert('✅ Progress updated! The community user has been notified.');
      setSelected(null);
      setProgressForm({ progress:0, message:'' });
      loadProblems();
    } catch { alert('Update failed'); }
    finally { setLoading(false); }
  };

  const stats = {
    total:      problems.length,
    assigned:   problems.filter(p => p.status === 'assigned').length,
    inProgress: problems.filter(p => p.status === 'in_progress').length,
    resolved:   problems.filter(p => p.status === 'resolved').length,
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f0fff4', fontFamily:'Segoe UI, sans-serif' }}>
      <div style={{ background:'linear-gradient(135deg,#1b5e20,#2e7d32)', color:'#fff', padding:'0 28px', display:'flex', justifyContent:'space-between', alignItems:'center', height:64 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>👥</span>
          <div>
            <div style={{ fontWeight:800, fontSize:16 }}>Team Portal</div>
            <div style={{ fontSize:12, opacity:0.8 }}>{user?.name} | {user?.teamName || 'NGO Team'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <button onClick={() => { setShowNotif(!showNotif); clearUnread(); }}
              style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', padding:'8px 14px', borderRadius:20, cursor:'pointer', fontSize:18 }}>
              🔔{unreadCount > 0 && <span style={{ position:'absolute', top:-4, right:-4, background:'#e53935', color:'#fff', borderRadius:'50%', width:18, height:18, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{unreadCount}</span>}
            </button>
            {showNotif && (
              <div style={{ position:'absolute', right:0, top:44, width:300, background:'#fff', borderRadius:16, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', zIndex:100, maxHeight:360, overflowY:'auto' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #e8eaf6', fontWeight:800, color:'#1b5e20' }}>Notifications</div>
                {notifications.length === 0 ? <div style={{ padding:24, textAlign:'center', color:'#666' }}>No notifications</div>
                  : notifications.map((n,i) => <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid #f0f4f8' }}><div style={{ fontWeight:700, fontSize:14, color:'#1b5e20' }}>{n.title}</div><div style={{ fontSize:13, color:'#666' }}>{n.message}</div></div>)}
              </div>
            )}
          </div>
          <button onClick={logout} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', padding:'8px 16px', borderRadius:20, cursor:'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ background:'#fff', padding:'0 28px', display:'flex', gap:4, borderBottom:'2px solid #e8f5e9' }}>
        {[['problems','📋 Assigned Problems'],['progress','📈 Team Progress']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'14px 20px', border:'none', background:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:tab===t?'#1b5e20':'#666', borderBottom:tab===t?'3px solid #1b5e20':'3px solid transparent' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding:28, maxWidth:1000, margin:'0 auto' }}>
        {/* Stats */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:28 }}>
          {[['Total Assigned',stats.total,'#1b5e20'],['New',stats.assigned,'#f59e0b'],['In Progress',stats.inProgress,'#10b981'],['Resolved',stats.resolved,'#43a047']].map(([l,v,c]) => (
            <div key={l} style={{ background:'#fff', padding:'16px 22px', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.07)', flex:1, minWidth:120, borderLeft:'5px solid '+c }}>
              <div style={{ fontSize:28, fontWeight:800, color:c }}>{v}</div>
              <div style={{ fontSize:13, color:'#666', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>

        {tab === 'problems' && (
          <div>
            <h2 style={{ color:'#1b5e20', marginBottom:20, fontWeight:800 }}>📋 Problems Assigned to {user?.teamName}</h2>
            {problems.length === 0 ? (
              <div style={{ background:'#fff', padding:60, borderRadius:20, textAlign:'center', color:'#666' }}>
                <div style={{ fontSize:56, marginBottom:16 }}>📋</div>
                <p>No problems assigned to your team yet.</p>
              </div>
            ) : problems.map(p => (
              <div key={p._id} style={{ background:'#fff', padding:22, borderRadius:16, marginBottom:14, boxShadow:'0 4px 14px rgba(0,0,0,0.07)', borderLeft:'5px solid '+(STATUS_COLOR[p.status]||'#999') }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, flexWrap:'wrap', gap:8 }}>
                  <div>
                    <strong style={{ fontSize:15, color:'#1b5e20' }}>{p.title}</strong>
                    <p style={{ color:'#666', fontSize:13, margin:'4px 0' }}>{p.description?.slice(0,120)}...</p>
                    <p style={{ color:'#555', fontSize:13, margin:0 }}>📍 {p.location} | 👥 {p.peopleAffected} affected | 🏷️ {p.category}</p>
                    {p.postedBy && <p style={{ color:'#1565c0', fontSize:13, margin:'4px 0 0' }}>👤 {p.postedBy.name} ({p.postedBy.email})</p>}
                  </div>
                  <span style={{ background:STATUS_COLOR[p.status]+'20', color:STATUS_COLOR[p.status], padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:800, whiteSpace:'nowrap' }}>
                    {p.status?.replace('_',' ').toUpperCase()}
                  </span>
                </div>

                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#666', marginBottom:6 }}>
                    <span>Progress</span><span style={{ fontWeight:800 }}>{p.progress}%</span>
                  </div>
                  <div style={{ background:'#e8f5e9', borderRadius:6, height:10, overflow:'hidden' }}>
                    <div style={{ background:p.progress===100?'#43a047':'#1b5e20', height:10, width:p.progress+'%', borderRadius:6, transition:'width 0.8s' }} />
                  </div>
                </div>

                {p.updates?.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#555', marginBottom:6 }}>Latest Update:</div>
                    <div style={{ padding:'10px 14px', background:'#f0fff4', borderRadius:10, fontSize:13 }}>
                      <div style={{ color:'#1b5e20', fontWeight:600 }}>{p.updates[p.updates.length-1].message}</div>
                      <div style={{ color:'#999', fontSize:12, marginTop:3 }}>{new Date(p.updates[p.updates.length-1].updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                )}

                <button onClick={() => { setSelected(p); setProgressForm({ progress:p.progress, message:'' }); }}
                  style={{ padding:'9px 20px', background:'#1b5e20', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:800, fontSize:13 }}>
                  📝 Update Progress
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'progress' && (
          <div>
            <h2 style={{ color:'#1b5e20', marginBottom:20, fontWeight:800 }}>📈 Team Progress</h2>
            <div style={{ background:'#fff', padding:24, borderRadius:20, boxShadow:'0 4px 16px rgba(0,0,0,0.07)' }}>
              {problems.length === 0 ? (
                <div style={{ padding:40, textAlign:'center', color:'#666' }}>No data yet</div>
              ) : problems.map(p => (
                <div key={p._id} style={{ padding:'16px 0', borderBottom:'1px solid #f0f4f8' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:'#1b5e20' }}>{p.title}</div>
                      <div style={{ fontSize:12, color:'#999' }}>{p.category} | {p.peopleAffected} affected</div>
                    </div>
                    <span style={{ fontWeight:800, fontSize:16, color:p.progress===100?'#43a047':'#1b5e20' }}>{p.progress}%</span>
                  </div>
                  <div style={{ background:'#e8f5e9', borderRadius:6, height:8 }}>
                    <div style={{ background:p.progress===100?'#43a047':'#1b5e20', height:8, width:p.progress+'%', borderRadius:6 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:32, width:'100%', maxWidth:480 }}>
            <h3 style={{ color:'#1b5e20', marginBottom:8, fontWeight:800 }}>📝 Update Progress</h3>
            <p style={{ color:'#666', fontSize:14, marginBottom:24 }}><strong>{selected.title}</strong><br/>The user will be notified of this update in real time.</p>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Progress: {progressForm.progress}%</label>
              <input type="range" min="0" max="100" step="5" value={progressForm.progress}
                onChange={e => setProgressForm({...progressForm, progress:+e.target.value})}
                style={{ width:'100%', accentColor:'#1b5e20' }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#bbb', marginTop:4 }}>
                <span>Not started</span><span>Halfway</span><span>Complete</span>
              </div>
              {progressForm.progress === 100 && (
                <div style={{ marginTop:8, padding:'10px 14px', background:'#e8f5e9', borderRadius:10, color:'#1b5e20', fontSize:13, fontWeight:700 }}>
                  ✅ Setting to 100% will mark this problem as RESOLVED
                </div>
              )}
            </div>
            <div style={{ marginBottom:22 }}>
              <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Update Message *</label>
              <textarea value={progressForm.message} onChange={e => setProgressForm({...progressForm, message:e.target.value})}
                style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, height:100, resize:'none', boxSizing:'border-box', outline:'none' }}
                placeholder="What actions were taken? What is the current status? What are the next steps?" required />
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => handleProgress(selected._id)} disabled={loading || !progressForm.message}
                style={{ flex:1, padding:13, background:'#1b5e20', color:'#fff', border:'none', borderRadius:12, fontWeight:800, cursor:'pointer', fontSize:15, opacity:!progressForm.message?0.5:1 }}>
                {loading ? 'Saving...' : '✅ Save & Notify User'}
              </button>
              <button onClick={() => setSelected(null)} style={{ flex:1, padding:13, background:'#f0f4f8', color:'#333', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:15 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}