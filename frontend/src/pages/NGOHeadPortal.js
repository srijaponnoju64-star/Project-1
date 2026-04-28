import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllProblems, analyseProblem, assignProblem,
  getTeamMembers, getPendingVolunteers, getPendingTeam,
  approveTeamMember, approveVolunteer, rejectVolunteer,
  getAnalyticsOverview, getAllApplications, analyseApplication, decideApplication,
  getNotifications
} from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import axios from 'axios';

const STATUS_COLOR  = { pending:'#f59e0b', analysed:'#3b82f6', assigned:'#8b5cf6', in_progress:'#10b981', resolved:'#22c55e', closed:'#6b7280' };
const URGENCY_COLOR = { critical:'#e53935', high:'#f97316', medium:'#eab308', low:'#22c55e' };
const CHART_COLORS  = ['#1a237e','#42a5f5','#43a047','#e53935','#fb8c00','#8e24aa','#00897b','#f06292','#78909c','#26a69a'];
const TEAMS = ['Health & Medical Team','Food & Nutrition Team','Education Team','Shelter & Housing Team','Sanitation Team','Transport Team','Elder Care Team','Child Welfare Team','Disaster Response Team','Environment Team','General Team'];

export default function NGOHeadPortal() {
  const { user, logout, notifications: liveNotifs, unreadCount, clearUnread } = useAuth();
  const [tab, setTab]                   = useState('problems');
  const [problems, setProblems]         = useState([]);
  const [members, setMembers]           = useState([]);
  const [pendingVols, setPendingVols]   = useState([]);
  const [pendingTeam, setPendingTeam]   = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats]               = useState(null);
  const [selected, setSelected]         = useState(null);
  const [assignTeam, setAssignTeam]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat]       = useState('all');
  const [filterUrg, setFilterUrg]       = useState('all');
  const [chartData, setChartData]       = useState([]);
  const [showNotif, setShowNotif]       = useState(false);
  const [history, setHistory]           = useState([]);
  const [sendNotifForm, setSendNotifForm] = useState({ to:'all', message:'', title:'' });
  const [selectedApp, setSelectedApp]   = useState(null);
  const [appDecision, setAppDecision]   = useState({ decision:'', response:'' });

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadAll(); }, [search, filterStatus, filterCat, filterUrg]);

  // Track history
  useEffect(() => {
    const item = { time: new Date().toLocaleString(), action: 'Portal accessed by ' + user?.name };
    setHistory(prev => [item, ...prev.slice(0, 49)]);
  }, []);

  const loadAll = async () => {
    try {
      const [p, m, pv, pt, s, apps] = await Promise.all([
        getAllProblems(), getTeamMembers(), getPendingVolunteers(),
        getPendingTeam(), getAnalyticsOverview(), getAllApplications()
      ]);
      let all = p.data.problems || [];
      let filtered = all;
      if (search)                filtered = filtered.filter(pr => pr.title?.toLowerCase().includes(search.toLowerCase()));
      if (filterStatus !== 'all') filtered = filtered.filter(pr => pr.status === filterStatus);
      if (filterCat !== 'all')    filtered = filtered.filter(pr => pr.category === filterCat);
      if (filterUrg !== 'all')    filtered = filtered.filter(pr => pr.urgencyLevel === filterUrg);
      setProblems(filtered);
      setMembers(m.data.members || []);
      setPendingVols(pv.data.volunteers || []);
      setPendingTeam(pt.data.members || []);
      setStats(s.data.stats);
      setApplications(apps.data.applications || []);
      const cats = {};
      all.forEach(pr => { cats[pr.category] = (cats[pr.category] || 0) + 1; });
      setChartData(Object.entries(cats).map(([k, v]) => ({ name: k, value: v })));
    } catch (e) { console.error(e); }
  };

  const handleAnalyse = async (id) => {
    setLoading(true);
    try {
      const res = await analyseProblem(id);
      setProblems(problems.map(p => p._id === id ? res.data.problem : p));
      if (selected?._id === id) setSelected(res.data.problem);
      addHistory('AI Analysis run on problem: ' + res.data.problem.title);
      alert('✅ AI Analysis complete!');
    } catch { alert('Analysis failed'); }
    finally { setLoading(false); }
  };

  const handleAssign = async (id) => {
    if (!assignTeam) return alert('Please select a team');
    try {
      await assignProblem(id, { teamName: assignTeam });
      addHistory('Problem assigned to ' + assignTeam + ': ' + selected?.title);
      alert('✅ Assigned to ' + assignTeam + '!');
      setSelected(null);
      loadAll();
    } catch { alert('Assignment failed'); }
  };

  const handleApproveTeam = async (id) => {
    try { await approveTeamMember(id); addHistory('Team member approved'); alert('✅ Team member approved!'); loadAll(); } catch { alert('Failed'); }
  };

  const handleApproveVol = async (id) => {
    try { await approveVolunteer(id); addHistory('Volunteer approved'); alert('✅ Volunteer approved!'); loadAll(); } catch { alert('Failed'); }
  };

  const handleRejectVol = async (id) => {
    if (!window.confirm('Reject this volunteer?')) return;
    try { await rejectVolunteer(id); addHistory('Volunteer rejected'); loadAll(); } catch { alert('Failed'); }
  };

  const handleAnalyseApp = async (id) => {
    try {
      const res = await analyseApplication(id);
      setApplications(applications.map(a => a._id === id ? res.data.application : a));
      if (selectedApp?._id === id) setSelectedApp(res.data.application);
      addHistory('AI Analysis run on volunteer application');
      alert('✅ Application analysed!');
    } catch { alert('Failed'); }
  };

  const handleDecideApp = async (id, decision) => {
    if (!appDecision.response) return alert('Please enter a response message for the applicant');
    try {
      await decideApplication(id, { decision, response: appDecision.response });
      addHistory('Volunteer application ' + decision + ': ' + selectedApp?.name);
      alert('✅ Decision sent to volunteer via notification!');
      setSelectedApp(null);
      setAppDecision({ decision:'', response:'' });
      loadAll();
    } catch { alert('Failed'); }
  };

  const handleSendNotif = async () => {
    if (!sendNotifForm.title || !sendNotifForm.message) return alert('Enter title and message');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/notifications/send', sendNotifForm, { headers: { Authorization: 'Bearer ' + token } });
      addHistory('Notification sent to ' + sendNotifForm.to + ': ' + sendNotifForm.title);
      alert('✅ Notification sent!');
      setSendNotifForm({ to:'all', message:'', title:'' });
    } catch { alert('Failed to send notification'); }
  };

  const addHistory = (action) => {
    setHistory(prev => [{ time: new Date().toLocaleString(), action }, ...prev.slice(0, 49)]);
  };

  const pendingApps = applications.filter(a => a.status === 'pending');
  const totalPending = pendingTeam.length + pendingVols.length + pendingApps.length;

  const TABS = [
    ['problems',  '📋 Problems (' + problems.length + ')'],
    ['applications', '📝 Applications (' + pendingApps.length + ')'],
    ['pending',   '⏳ Approvals (' + (pendingTeam.length + pendingVols.length) + ')'],
    ['team',      '👥 Team (' + members.length + ')'],
    ['analytics', '📊 Analytics'],
    ['notify',    '📢 Send Notifications'],
    ['monitor',   '👁️ Monitor'],
    ['history',   '📋 History'],
  ];

  const iStyle = { padding:'10px 14px', borderRadius:10, border:'1.5px solid #e8eaf6', fontSize:14, outline:'none', background:'#fff' };

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Segoe UI, sans-serif' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1a237e,#283593)', color:'#fff', padding:'0 28px', display:'flex', justifyContent:'space-between', alignItems:'center', height:64, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:26 }}>🏢</span>
          <div>
            <div style={{ fontWeight:800, fontSize:17 }}>NGO Head Portal</div>
            <div style={{ fontSize:12, opacity:0.8 }}>{user?.name} — Full Access</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          {totalPending > 0 && <div style={{ background:'#e53935', color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:13, fontWeight:800 }}>🔔 {totalPending} pending</div>}
          <div style={{ position:'relative' }}>
            <button onClick={() => { setShowNotif(!showNotif); clearUnread(); }}
              style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', padding:'8px 14px', borderRadius:20, cursor:'pointer', fontSize:18 }}>
              🔔{unreadCount > 0 && <span style={{ position:'absolute', top:-4, right:-4, background:'#e53935', color:'#fff', borderRadius:'50%', width:18, height:18, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{unreadCount}</span>}
            </button>
            {showNotif && (
              <div style={{ position:'absolute', right:0, top:44, width:320, background:'#fff', borderRadius:16, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', zIndex:200, maxHeight:400, overflowY:'auto' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #e8eaf6', fontWeight:800, color:'#1a237e' }}>Live Notifications</div>
                {liveNotifs.length === 0 ? <div style={{ padding:24, textAlign:'center', color:'#666' }}>No notifications</div>
                  : liveNotifs.map((n,i) => <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid #f0f4f8' }}><div style={{ fontWeight:700, fontSize:14, color:'#1a237e' }}>{n.title}</div><div style={{ fontSize:13, color:'#666' }}>{n.message}</div></div>)}
              </div>
            )}
          </div>
          <button onClick={logout} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', padding:'8px 18px', borderRadius:20, cursor:'pointer', fontWeight:600 }}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:'#fff', padding:'0 20px', display:'flex', gap:2, borderBottom:'2px solid #e8eaf6', overflowX:'auto', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        {TABS.map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'13px 14px', border:'none', background:'none', cursor:'pointer', fontSize:12, fontWeight:700, whiteSpace:'nowrap', color:tab===t?'#1a237e':'#888', borderBottom:tab===t?'3px solid #1a237e':'3px solid transparent' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding:24, maxWidth:1200, margin:'0 auto' }}>

        {/* PROBLEMS */}
        {tab === 'problems' && (
          <div>
            <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
              <input placeholder="🔍 Search problems..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...iStyle, flex:1, minWidth:200 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={iStyle}>
                {['all','pending','analysed','assigned','in_progress','resolved'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={iStyle}>
                {['all','food','health','education','shelter','sanitation','disaster','transport','elderly','children','other'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <select value={filterUrg} onChange={e => setFilterUrg(e.target.value)} style={iStyle}>
                {['all','critical','high','medium','low'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap:24 }}>
              <div>
                <div style={{ fontWeight:700, color:'#666', marginBottom:12, fontSize:14 }}>{problems.length} problems</div>
                {problems.length === 0 && <div style={{ background:'#fff', padding:60, borderRadius:20, textAlign:'center', color:'#666' }}><div style={{ fontSize:48 }}>📋</div><p>No problems match filters</p></div>}
                {problems.map(p => (
                  <div key={p._id} onClick={() => { setSelected(p); setAssignTeam(p.aiRecommendedTeam || ''); }}
                    style={{ background:'#fff', padding:18, borderRadius:14, marginBottom:12, cursor:'pointer', borderLeft:'5px solid '+(URGENCY_COLOR[p.urgencyLevel]||'#999'), boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:selected?._id===p._id?'2px solid #1a237e':'1px solid #e8eaf6' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ flex:1 }}>
                        <strong style={{ fontSize:15, color:'#1a237e' }}>{p.title}</strong>
                        <p style={{ color:'#666', fontSize:13, margin:'4px 0' }}>👤 {p.postedBy?.name} | 📍 {p.location} | 👥 {p.peopleAffected} affected</p>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span style={{ background:URGENCY_COLOR[p.urgencyLevel]+'20', color:URGENCY_COLOR[p.urgencyLevel], padding:'2px 10px', borderRadius:10, fontSize:12, fontWeight:700 }}>{p.urgencyLevel?.toUpperCase()}</span>
                      <span style={{ background:STATUS_COLOR[p.status]+'20', color:STATUS_COLOR[p.status], padding:'2px 10px', borderRadius:10, fontSize:12, fontWeight:700 }}>{p.status?.replace('_',' ').toUpperCase()}</span>
                      <span style={{ background:'#e8eaf6', color:'#1a237e', padding:'2px 10px', borderRadius:10, fontSize:12 }}>{p.category}</span>
                    </div>
                    {p.aiUrgencyScore > 0 && <div style={{ marginTop:8, fontSize:12, color:'#6a1b9a', fontWeight:600 }}>🤖 AI Score: {p.aiUrgencyScore}/100 | {p.aiRecommendedTeam}</div>}
                    {p.progress > 0 && <div style={{ marginTop:8, background:'#e8eaf6', borderRadius:4, height:6 }}><div style={{ background:'#1a237e', height:6, borderRadius:4, width:p.progress+'%' }} /></div>}
                  </div>
                ))}
              </div>

              {selected && (
                <div style={{ background:'#fff', borderRadius:20, padding:24, boxShadow:'0 8px 30px rgba(0,0,0,0.12)', position:'sticky', top:20, maxHeight:'85vh', overflowY:'auto' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                    <h3 style={{ color:'#1a237e', margin:0, fontWeight:800 }}>Problem Details</h3>
                    <button onClick={() => setSelected(null)} style={{ background:'#f0f4f8', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer' }}>✕</button>
                  </div>
                  <strong style={{ color:'#1a237e' }}>{selected.title}</strong>
                  <p style={{ color:'#666', fontSize:13, margin:'10px 0', lineHeight:1.7 }}>{selected.description}</p>
                  {[['📍',selected.location],['👤',selected.postedBy?.name],['📧',selected.postedBy?.email],['📞',selected.postedBy?.phone||'N/A'],['👥',selected.peopleAffected+' affected'],['⚡',selected.urgencyLevel]].map(([icon,val]) => (
                    <div key={icon} style={{ display:'flex', gap:8, fontSize:13, marginBottom:5 }}>
                      <span>{icon}</span><span style={{ color:'#333', fontWeight:600 }}>{val}</span>
                    </div>
                  ))}
                  {selected.aiAnalysis && <div style={{ background:'linear-gradient(135deg,#e8eaf6,#f3e5f5)', borderRadius:12, padding:14, margin:'14px 0', fontSize:12, color:'#1a237e', whiteSpace:'pre-line', lineHeight:1.6 }}>{selected.aiAnalysis}</div>}
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
                    {selected.status === 'pending' && (
                      <button onClick={() => handleAnalyse(selected._id)} disabled={loading}
                        style={{ padding:'11px 0', background:'linear-gradient(135deg,#6a1b9a,#9c27b0)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700 }}>
                        {loading ? '⏳ Analysing...' : '🤖 Run AI Analysis'}
                      </button>
                    )}
                    {(selected.status === 'analysed' || selected.status === 'pending') && (
                      <div>
                        <select value={assignTeam} onChange={e => setAssignTeam(e.target.value)}
                          style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e8eaf6', marginBottom:8, fontSize:14, background:'#fff' }}>
                          <option value="">Select Team to Assign...</option>
                          {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={() => handleAssign(selected._id)} disabled={!assignTeam}
                          style={{ width:'100%', padding:'11px 0', background:'#43a047', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, opacity:assignTeam?1:0.5 }}>
                          ✅ Assign to Team
                        </button>
                      </div>
                    )}
                    {selected.status === 'resolved' && <div style={{ padding:14, background:'#e8f5e9', borderRadius:10, color:'#2e7d32', fontWeight:700, textAlign:'center' }}>✅ Problem Resolved</div>}
                  </div>
                  {selected.updates?.length > 0 && (
                    <div style={{ marginTop:18 }}>
                      <strong style={{ fontSize:13, color:'#1a237e' }}>Team Updates:</strong>
                      {selected.updates.map((u,i) => (
                        <div key={i} style={{ padding:'8px 12px', background:'#f0f4f8', borderRadius:8, marginTop:6, fontSize:12 }}>
                          <div style={{ fontWeight:700, color:'#1a237e' }}>{u.message}</div>
                          <div style={{ color:'#999' }}>{new Date(u.updatedAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* APPLICATIONS */}
        {tab === 'applications' && (
          <div style={{ display:'grid', gridTemplateColumns: selectedApp ? '1fr 400px' : '1fr', gap:24 }}>
            <div>
              <h2 style={{ color:'#1a237e', marginBottom:20, fontWeight:800 }}>📝 Volunteer Applications</h2>
              {applications.length === 0 ? (
                <div style={{ background:'#fff', padding:60, borderRadius:20, textAlign:'center', color:'#666' }}><div style={{ fontSize:48 }}>📝</div><p>No applications yet</p></div>
              ) : applications.map(app => (
                <div key={app._id} onClick={() => { setSelectedApp(app); setAppDecision({ decision:'', response:'' }); }}
                  style={{ background:'#fff', padding:18, borderRadius:14, marginBottom:12, cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:selectedApp?._id===app._id?'2px solid #1a237e':'1px solid #e8eaf6', borderLeft:'5px solid '+(app.status==='approved'?'#43a047':app.status==='rejected'?'#e53935':'#f59e0b') }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <strong style={{ color:'#1a237e' }}>{app.volunteer?.name || app.name}</strong>
                    <span style={{ padding:'2px 12px', borderRadius:10, fontSize:12, fontWeight:800, background:app.status==='approved'?'#e8f5e9':app.status==='rejected'?'#ffebee':'#fff8e1', color:app.status==='approved'?'#43a047':app.status==='rejected'?'#e53935':'#f57f17' }}>
                      {app.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color:'#666', fontSize:13, margin:'4px 0' }}>{app.volunteer?.email} | Skills: {app.skills?.slice(0,50)}</p>
                  {app.aiScore > 0 && <p style={{ color:'#6a1b9a', fontSize:13, fontWeight:700, margin:'4px 0' }}>🤖 AI Score: {app.aiScore}/100 — {app.aiDecision === 'recommended' ? '✅ Recommended' : '⚠️ Review carefully'}</p>}
                </div>
              ))}
            </div>

            {selectedApp && (
              <div style={{ background:'#fff', borderRadius:20, padding:24, boxShadow:'0 8px 30px rgba(0,0,0,0.12)', position:'sticky', top:20, maxHeight:'85vh', overflowY:'auto' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                  <h3 style={{ color:'#1a237e', margin:0, fontWeight:800 }}>Application Details</h3>
                  <button onClick={() => setSelectedApp(null)} style={{ background:'#f0f4f8', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer' }}>✕</button>
                </div>
                <strong style={{ color:'#1a237e', fontSize:15 }}>{selectedApp.name}</strong>
                <p style={{ fontSize:13, color:'#666', margin:'6px 0' }}>{selectedApp.email} | {selectedApp.phone}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:10, margin:'14px 0' }}>
                  {[['Why Join', selectedApp.whyJoin],['Skills', selectedApp.skills],['Experience', selectedApp.experience],['Availability', selectedApp.availability],['Area', selectedApp.area]].map(([l,v]) => (
                    <div key={l}>
                      <div style={{ fontSize:11, fontWeight:800, color:'#999', textTransform:'uppercase' }}>{l}</div>
                      <div style={{ fontSize:13, color:'#333', marginTop:2 }}>{v || 'Not provided'}</div>
                    </div>
                  ))}
                </div>
                {selectedApp.aiSummary && (
                  <div style={{ background:'linear-gradient(135deg,#e8eaf6,#f3e5f5)', borderRadius:12, padding:14, marginBottom:14, fontSize:12, color:'#1a237e', whiteSpace:'pre-line', lineHeight:1.6 }}>
                    {selectedApp.aiSummary}
                  </div>
                )}
                {selectedApp.status === 'pending' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <button onClick={() => handleAnalyseApp(selectedApp._id)}
                      style={{ padding:'11px 0', background:'linear-gradient(135deg,#6a1b9a,#9c27b0)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700 }}>
                      🤖 Run AI Analysis
                    </button>
                    <textarea value={appDecision.response} onChange={e => setAppDecision({...appDecision, response:e.target.value})}
                      placeholder="Write a response message for the applicant (required)..."
                      style={{ padding:'11px 14px', borderRadius:10, border:'1.5px solid #e8eaf6', fontSize:13, height:80, resize:'none', outline:'none' }} />
                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={() => handleDecideApp(selectedApp._id, 'approved')} disabled={!appDecision.response}
                        style={{ flex:1, padding:11, background:'#43a047', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:800, opacity:appDecision.response?1:0.5 }}>✅ Approve</button>
                      <button onClick={() => handleDecideApp(selectedApp._id, 'rejected')} disabled={!appDecision.response}
                        style={{ flex:1, padding:11, background:'#e53935', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:800, opacity:appDecision.response?1:0.5 }}>❌ Reject</button>
                    </div>
                  </div>
                )}
                {selectedApp.status !== 'pending' && (
                  <div style={{ padding:14, background:selectedApp.status==='approved'?'#e8f5e9':'#ffebee', borderRadius:10, color:selectedApp.status==='approved'?'#1b5e20':'#c62828', fontWeight:700 }}>
                    Decision: {selectedApp.status.toUpperCase()}<br/>Response: {selectedApp.ngoResponse}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PENDING APPROVALS */}
        {tab === 'pending' && (
          <div>
            <h2 style={{ color:'#1a237e', marginBottom:24, fontWeight:800 }}>⏳ Pending Approvals</h2>
            {pendingTeam.length > 0 && (
              <div style={{ marginBottom:28 }}>
                <h3 style={{ color:'#555', marginBottom:14, fontWeight:700 }}>👥 Team Members</h3>
                {pendingTeam.map(m => (
                  <div key={m._id} style={{ background:'#fff', padding:18, borderRadius:14, marginBottom:12, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,#1a237e,#42a5f5)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:17 }}>{m.name?.slice(0,2).toUpperCase()}</div>
                    <div style={{ flex:1 }}>
                      <strong>{m.name}</strong>
                      <p style={{ fontSize:13, color:'#666', margin:'2px 0' }}>{m.email} | Team: {m.teamName || 'Not specified'}</p>
                    </div>
                    <button onClick={() => handleApproveTeam(m._id)} style={{ padding:'8px 18px', background:'#43a047', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700 }}>✅ Approve</button>
                  </div>
                ))}
              </div>
            )}
            {pendingVols.length > 0 && (
              <div>
                <h3 style={{ color:'#555', marginBottom:14, fontWeight:700 }}>🙋 Volunteer Registrations</h3>
                {pendingVols.map(v => (
                  <div key={v._id} style={{ background:'#fff', padding:18, borderRadius:14, marginBottom:12, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,#6a1b9a,#ab47bc)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:17 }}>{v.name?.slice(0,2).toUpperCase()}</div>
                    <div style={{ flex:1 }}>
                      <strong>{v.name}</strong>
                      <p style={{ fontSize:13, color:'#666', margin:'2px 0' }}>{v.email} | {v.phone}</p>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => handleApproveVol(v._id)} style={{ padding:'8px 14px', background:'#43a047', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700 }}>✅</button>
                      <button onClick={() => handleRejectVol(v._id)} style={{ padding:'8px 14px', background:'#e53935', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700 }}>❌</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingTeam.length === 0 && pendingVols.length === 0 && (
              <div style={{ background:'#fff', padding:60, borderRadius:20, textAlign:'center', color:'#666' }}><div style={{ fontSize:64, marginBottom:12 }}>✅</div><p>No pending approvals</p></div>
            )}
          </div>
        )}

        {/* TEAM */}
        {tab === 'team' && (
          <div>
            <h2 style={{ color:'#1a237e', marginBottom:24, fontWeight:800 }}>👥 Team Members and Volunteers</h2>
            {members.length === 0 ? (
              <div style={{ background:'#fff', padding:60, borderRadius:20, textAlign:'center', color:'#666' }}><div style={{ fontSize:64 }}>👥</div><p>No members yet</p></div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
                {members.map(m => (
                  <div key={m._id} style={{ background:'#fff', padding:20, borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8eaf6' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                      <div style={{ width:46, height:46, borderRadius:'50%', background:m.role==='volunteer'?'linear-gradient(135deg,#6a1b9a,#ab47bc)':'linear-gradient(135deg,#1a237e,#42a5f5)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:17 }}>
                        {m.name?.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ color:'#1a237e' }}>{m.name}</strong>
                        <div style={{ fontSize:12, color:'#666' }}>{m.role==='volunteer'?'🙋 Volunteer':'👥 '+m.teamName}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:13, color:'#555', display:'flex', flexDirection:'column', gap:4 }}>
                      <span>📧 {m.email}</span>
                      {m.phone && <span>📞 {m.phone}</span>}
                    </div>
                    <div style={{ marginTop:12 }}>
                      <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:m.isActive?'#e8f5e9':'#ffebee', color:m.isActive?'#43a047':'#e53935' }}>
                        {m.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <div>
            <h2 style={{ color:'#1a237e', marginBottom:24, fontWeight:800 }}>📊 Analytics</h2>
            {stats && (
              <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:28 }}>
                {[['Total Needs',stats.totalNeeds,'#1a237e'],['Active',stats.activeNeeds,'#e53935'],['Completed',stats.completedNeeds,'#43a047'],['Volunteers',stats.totalVolunteers,'#6a1b9a'],['NGOs',stats.totalNGOs,'#00838f'],['People Helped',stats.peopleHelped,'#e65100']].map(([l,v,c]) => (
                  <div key={l} style={{ background:'#fff', padding:'20px 24px', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.08)', flex:1, minWidth:130, borderLeft:'5px solid '+c }}>
                    <div style={{ fontSize:28, fontWeight:800, color:c }}>{v??0}</div>
                    <div style={{ fontSize:13, color:'#666', marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            {chartData.length > 0 ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
                <div style={{ background:'#fff', padding:24, borderRadius:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ color:'#1a237e', marginBottom:16, fontWeight:700 }}>Problems by Category</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fontSize:11 }} /><YAxis /><Tooltip />
                      <Bar dataKey="value" fill="#1a237e" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background:'#fff', padding:24, borderRadius:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ color:'#1a237e', marginBottom:16, fontWeight:700 }}>Distribution</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                        label={({name,percent}) => name+' '+(percent*100).toFixed(0)+'%'}>
                        {chartData.map((_,i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : <div style={{ background:'#fff', padding:60, borderRadius:20, textAlign:'center', color:'#666' }}><div style={{ fontSize:48 }}>📊</div><p>No data yet</p></div>}
          </div>
        )}

        {/* SEND NOTIFICATIONS */}
        {tab === 'notify' && (
          <div style={{ maxWidth:600 }}>
            <h2 style={{ color:'#1a237e', marginBottom:24, fontWeight:800 }}>📢 Send Notifications</h2>
            <div style={{ background:'#fff', padding:32, borderRadius:20, boxShadow:'0 4px 16px rgba(0,0,0,0.07)' }}>
              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Send To</label>
                <select value={sendNotifForm.to} onChange={e => setSendNotifForm({...sendNotifForm, to:e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, background:'#fff' }}>
                  <option value="all">📢 All Portals</option>
                  <option value="volunteers">🙋 Volunteers Only</option>
                  <option value="teams">👥 Team Members Only</option>
                  <option value="users">👤 Community Users Only</option>
                </select>
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Notification Title</label>
                <input value={sendNotifForm.title} onChange={e => setSendNotifForm({...sendNotifForm, title:e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, boxSizing:'border-box' }}
                  placeholder="e.g. Important Update for All Members" />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Message</label>
                <textarea value={sendNotifForm.message} onChange={e => setSendNotifForm({...sendNotifForm, message:e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, height:120, resize:'vertical', boxSizing:'border-box' }}
                  placeholder="Type your notification message here..." />
              </div>
              <button onClick={handleSendNotif}
                style={{ width:'100%', padding:14, background:'linear-gradient(135deg,#1a237e,#1565c0)', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:800, cursor:'pointer' }}>
                📤 Send Notification
              </button>
            </div>
          </div>
        )}

        {/* MONITOR */}
        {tab === 'monitor' && (
          <div>
            <h2 style={{ color:'#1a237e', marginBottom:24, fontWeight:800 }}>👁️ Monitor All Portals</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {[
                { icon:'👤', title:'Community User Portal', color:'#42a5f5', count:'Multiple users', items:['Report problems with voice recording','Track resolution in real time','Receive team updates instantly','Cannot see other users data'] },
                { icon:'🏢', title:'NGO Head Portal', color:'#66bb6a', count:'You — Full access', items:['View all community problems','AI analysis and assignment','Manage team approvals','Send notifications to all portals'] },
                { icon:'👥', title:'NGO Team Portal', color:'#ffa726', count:members.filter(m=>m.role==='ngo_team').length+' members', items:['See only their assigned problems','Update progress in real time','Users notified of every update','Separate login per team'] },
                { icon:'🙋', title:'Volunteer Portal', color:'#ab47bc', count:members.filter(m=>m.role==='volunteer').length+' volunteers', items:['Submit join application','Receive decision notification','Accept or decline tasks','View task history'] },
              ].map((p,i) => (
                <div key={i} style={{ background:'#fff', borderRadius:20, padding:28, boxShadow:'0 4px 20px rgba(0,0,0,0.08)', borderTop:'4px solid '+p.color }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                    <span style={{ fontSize:36 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight:800, color:p.color, fontSize:16 }}>{p.title}</div>
                      <div style={{ color:'#666', fontSize:13 }}>{p.count}</div>
                    </div>
                  </div>
                  {p.items.map((item,j) => <div key={j} style={{ fontSize:13, color:'#555', padding:'4px 0', display:'flex', gap:6 }}><span style={{ color:p.color }}>✓</span>{item}</div>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div>
            <h2 style={{ color:'#1a237e', marginBottom:24, fontWeight:800 }}>📋 Activity History</h2>
            <div style={{ background:'#fff', borderRadius:20, padding:24, boxShadow:'0 4px 16px rgba(0,0,0,0.07)' }}>
              {history.length === 0 ? (
                <div style={{ padding:40, textAlign:'center', color:'#666' }}>No activity recorded yet. Actions you take will appear here.</div>
              ) : history.map((h, i) => (
                <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid #f0f4f8', display:'flex', gap:16, alignItems:'flex-start' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#1a237e', marginTop:5, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:14, color:'#333', fontWeight:600 }}>{h.action}</div>
                    <div style={{ fontSize:12, color:'#bbb', marginTop:2 }}>{h.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}