import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { postProblem, getMyProblems } from '../services/api';

const CATEGORIES = ['food','health','education','shelter','sanitation','transport','elderly','children','disaster','other'];
const STATUS_COLOR  = { pending:'#f59e0b', analysed:'#3b82f6', assigned:'#8b5cf6', in_progress:'#10b981', resolved:'#22c55e', closed:'#6b7280' };
const STATUS_LABEL  = { pending:'Pending Review', analysed:'Being Analysed', assigned:'Team Assigned', in_progress:'Work in Progress', resolved:'✅ Resolved', closed:'Closed' };
const URGENCY_COLOR = { critical:'#e53935', high:'#f97316', medium:'#eab308', low:'#22c55e' };

export default function UserPortal() {
  const { user, logout, notifications, unreadCount, clearUnread } = useAuth();
  const [tab, setTab]           = useState('report');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const [form, setForm] = useState({
    title:'', description:'', category:'food', urgencyLevel:'medium', location:'', peopleAffected:1
  });

  useEffect(() => { loadProblems(); }, []);

  // Listen for real-time problem updates
  useEffect(() => {
    const handler = (e) => {
      const { problemId, status, progress } = e.detail;
      setProblems(prev => prev.map(p => p._id === problemId ? { ...p, status, progress } : p));
    };
    window.addEventListener('problem_updated', handler);
    return () => window.removeEventListener('problem_updated', handler);
  }, []);

  const loadProblems = async () => {
    try { const res = await getMyProblems(); setProblems(res.data.problems || []); } catch {}
  };

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recording is not supported in your browser. Please use Chrome.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const text = Array.from(event.results).map(r => r[0].transcript).join('');
      setTranscript(text);
      setForm(prev => ({ ...prev, description: text }));
    };
    recognition.onend = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  const stopVoiceRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return alert('Please fill in title and description');
    setLoading(true);
    try {
      await postProblem(form);
      setSuccess('Your problem has been reported successfully! Our NGO team will review it and respond shortly.');
      setForm({ title:'', description:'', category:'food', urgencyLevel:'medium', location:'', peopleAffected:1 });
      setTranscript('');
      loadProblems();
      setTab('track');
      setTimeout(() => setSuccess(''), 8000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Segoe UI, sans-serif' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1a237e,#1565c0)', color:'#fff', padding:'0 28px', display:'flex', justifyContent:'space-between', alignItems:'center', height:64 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>🌍</span>
          <div>
            <div style={{ fontWeight:800, fontSize:16 }}>CivicMatch — Community Portal</div>
            <div style={{ fontSize:12, opacity:0.8 }}>Welcome, {user?.name}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <button onClick={() => { setShowNotif(!showNotif); clearUnread(); }}
              style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', padding:'8px 14px', borderRadius:20, cursor:'pointer', fontSize:18 }}>
              🔔
              {unreadCount > 0 && <span style={{ position:'absolute', top:-4, right:-4, background:'#e53935', color:'#fff', borderRadius:'50%', width:18, height:18, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{unreadCount}</span>}
            </button>
            {showNotif && (
              <div style={{ position:'absolute', right:0, top:44, width:320, background:'#fff', borderRadius:16, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', zIndex:100, maxHeight:400, overflowY:'auto' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #e8eaf6', fontWeight:800, color:'#1a237e' }}>Notifications</div>
                {notifications.length === 0 ? (
                  <div style={{ padding:24, textAlign:'center', color:'#666' }}>No notifications yet</div>
                ) : notifications.map((n, i) => (
                  <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid #f0f4f8' }}>
                    <div style={{ fontWeight:700, fontSize:14, color:'#1a237e' }}>{n.title}</div>
                    <div style={{ fontSize:13, color:'#666', marginTop:2 }}>{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={logout} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', padding:'8px 16px', borderRadius:20, cursor:'pointer' }}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:'#fff', padding:'0 28px', display:'flex', gap:4, borderBottom:'2px solid #e8eaf6' }}>
        {[['report','📝 Report Problem'],['track','📊 My Reports (' + problems.length + ')']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'14px 20px', border:'none', background:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:tab===t?'#1a237e':'#666', borderBottom:tab===t?'3px solid #1a237e':'3px solid transparent' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding:28, maxWidth:820, margin:'0 auto' }}>

        {/* Report Tab */}
        {tab === 'report' && (
          <div>
            {success && (
              <div style={{ background:'#e8f5e9', border:'1.5px solid #43a047', color:'#1b5e20', padding:18, borderRadius:14, marginBottom:24, fontWeight:600, fontSize:15 }}>
                ✅ {success}
              </div>
            )}
            <div style={{ background:'#fff', padding:32, borderRadius:20, boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}>
              <h2 style={{ color:'#1a237e', marginBottom:6, fontWeight:800 }}>📝 Report a Community Problem</h2>
              <p style={{ color:'#666', marginBottom:28, fontSize:14 }}>Your report is confidential and will be reviewed by our NGO team. You can use voice recording to describe the problem.</p>

              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div>
                  <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Problem Title *</label>
                  <input value={form.title} onChange={e => setForm({...form, title:e.target.value})}
                    style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:15, outline:'none', boxSizing:'border-box' }}
                    placeholder="Give a short title to your problem" required />
                </div>

                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <label style={{ fontSize:13, fontWeight:700, color:'#555' }}>Description * (or use voice recording 🎤)</label>
                    <button type="button" onClick={recording ? stopVoiceRecording : startVoiceRecording}
                      style={{ padding:'7px 16px', background:recording?'#e53935':'#1a237e', color:'#fff', border:'none', borderRadius:20, cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                      {recording ? '⏹ Stop Recording' : '🎤 Start Recording'}
                    </button>
                  </div>
                  {recording && (
                    <div style={{ background:'#ffebee', border:'1px solid #e53935', borderRadius:10, padding:'10px 14px', marginBottom:8, fontSize:13, color:'#c62828', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ animation:'pulse 1s infinite', fontSize:16 }}>🔴</span> Recording... Speak clearly about the problem.
                    </div>
                  )}
                  <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})}
                    style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, height:130, resize:'vertical', outline:'none', boxSizing:'border-box', lineHeight:1.6 }}
                    placeholder="Describe the problem in detail. What is happening? Since when? Who is affected? What is needed?" required />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Category *</label>
                    <select value={form.category} onChange={e => setForm({...form, category:e.target.value})}
                      style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, background:'#fff', outline:'none' }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>How urgent is this? *</label>
                    <select value={form.urgencyLevel} onChange={e => setForm({...form, urgencyLevel:e.target.value})}
                      style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, background:'#fff', outline:'none' }}>
                      <option value="critical">🔴 Critical — Immediate danger</option>
                      <option value="high">🟠 High — Urgent, within 24 hours</option>
                      <option value="medium">🟡 Medium — This week</option>
                      <option value="low">🟢 Low — When possible</option>
                    </select>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Location / Area *</label>
                    <input value={form.location} onChange={e => setForm({...form, location:e.target.value})}
                      style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:15, outline:'none', boxSizing:'border-box' }}
                      placeholder="e.g. Street name, Area, City" required />
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>People Affected</label>
                    <input type="number" min="1" value={form.peopleAffected} onChange={e => setForm({...form, peopleAffected:+e.target.value})}
                      style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:15, outline:'none', boxSizing:'border-box' }} />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{ padding:16, background:'linear-gradient(135deg,#1a237e,#1565c0)', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px rgba(26,35,126,0.3)' }}>
                  {loading ? '⏳ Submitting...' : '📤 Submit Problem Report'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Track Tab */}
        {tab === 'track' && (
          <div>
            <h2 style={{ color:'#1a237e', marginBottom:24, fontWeight:800 }}>📊 My Problem Reports</h2>
            {problems.length === 0 ? (
              <div style={{ background:'#fff', padding:60, borderRadius:20, textAlign:'center', color:'#666' }}>
                <div style={{ fontSize:56, marginBottom:16 }}>📝</div>
                <h3 style={{ color:'#1a237e', marginBottom:8 }}>No reports yet</h3>
                <p>Report a problem and track its resolution here in real time.</p>
                <button onClick={() => setTab('report')} style={{ marginTop:16, padding:'12px 28px', background:'#1a237e', color:'#fff', border:'none', borderRadius:30, fontWeight:700, cursor:'pointer' }}>
                  Report a Problem
                </button>
              </div>
            ) : problems.map(p => (
              <div key={p._id} style={{ background:'#fff', padding:24, borderRadius:18, marginBottom:16, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', borderLeft:'5px solid ' + (URGENCY_COLOR[p.urgencyLevel]||'#999') }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                  <div>
                    <h3 style={{ color:'#1a237e', margin:0, fontSize:16, fontWeight:800 }}>{p.title}</h3>
                    <p style={{ color:'#666', fontSize:13, margin:'4px 0 0' }}>📍 {p.location} | 🏷️ {p.category} | 👥 {p.peopleAffected} affected</p>
                  </div>
                  <span style={{ background:STATUS_COLOR[p.status]+'20', color:STATUS_COLOR[p.status], padding:'6px 16px', borderRadius:20, fontSize:13, fontWeight:800, whiteSpace:'nowrap' }}>
                    {STATUS_LABEL[p.status] || p.status}
                  </span>
                </div>

                {/* Progress bar */}
                {p.progress > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#666', marginBottom:6 }}>
                      <span>Resolution Progress</span>
                      <span style={{ fontWeight:800, color:p.progress===100?'#43a047':'#1a237e' }}>{p.progress}%</span>
                    </div>
                    <div style={{ background:'#e8eaf6', borderRadius:6, height:10, overflow:'hidden' }}>
                      <div style={{ background:p.progress===100?'linear-gradient(135deg,#43a047,#66bb6a)':'linear-gradient(135deg,#1a237e,#42a5f5)', height:10, width:p.progress+'%', borderRadius:6, transition:'width 0.8s ease' }} />
                    </div>
                  </div>
                )}

                {p.assignedTeam && (
                  <div style={{ padding:'10px 14px', background:'#e8eaf6', borderRadius:10, fontSize:13, color:'#1a237e', fontWeight:600 }}>
                    👥 Assigned to: {p.assignedTeam}
                  </div>
                )}

                {p.updates?.length > 0 && (
                  <div style={{ marginTop:14 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'#555', marginBottom:8 }}>📋 Team Updates:</div>
                    {p.updates.map((u, i) => (
                      <div key={i} style={{ padding:'10px 14px', background:'#f8faff', borderRadius:10, marginBottom:6, fontSize:13 }}>
                        <div style={{ color:'#1a237e', fontWeight:700 }}>{u.message}</div>
                        <div style={{ color:'#999', fontSize:12, marginTop:3 }}>{new Date(u.updatedAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}

                {p.status === 'resolved' && (
                  <div style={{ marginTop:12, padding:'14px 18px', background:'#e8f5e9', borderRadius:12, border:'1.5px solid #43a047', color:'#1b5e20', fontWeight:700, fontSize:14 }}>
                    ✅ Your problem has been resolved! Thank you for helping improve our community.
                  </div>
                )}

                <div style={{ marginTop:10, fontSize:12, color:'#bbb' }}>
                  Reported on {new Date(p.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}