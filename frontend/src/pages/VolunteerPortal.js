import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVolunteerMe, updateVolunteerMe, getMatches, acceptMatch, rejectMatch, submitApplication, getMyApplications } from '../services/api';

export default function VolunteerPortal() {
  const { user, logout, notifications, unreadCount, clearUnread } = useAuth();
  const [tab, setTab]           = useState('application');
  const [_profile, setProfile]   = useState(null);
  const [matches, setMatches]   = useState([]);
  const [myApps, setMyApps]     = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [appForm, setAppForm]   = useState({ whyJoin:'', skills:'', experience:'', availability:'', area:'', phone:'' });
  const [profileForm, setProfileForm] = useState({ bio:'', skills:'', causes:'', maxDistanceKm:25, availability:{ weekdays:false, weekends:true } });
  const [submitting, setSubmitting] = useState(false);
  const [appSuccess, setAppSuccess] = useState('');

  useEffect(() => {
    getVolunteerMe().then(r => {
      const v = r.data.volunteer;
      if (v) { setProfile(v); setProfileForm({ bio:v.bio||'', skills:(v.skills||[]).join(', '), causes:(v.causes||[]).join(', '), maxDistanceKm:v.maxDistanceKm||25, availability:v.availability||{} }); }
    }).catch(() => {});
    getMatches().then(r => setMatches(r.data.matches || [])).catch(() => {});
    getMyApplications().then(r => setMyApps(r.data.applications || [])).catch(() => {});
  }, []);

  const handleSubmitApp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitApplication(appForm);
      setAppSuccess('Your application has been submitted! The NGO Head will review it and send you a notification with their decision.');
      setAppForm({ whyJoin:'', skills:'', experience:'', availability:'', area:'', phone:'' });
      getMyApplications().then(r => setMyApps(r.data.applications || []));
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateVolunteerMe({ ...profileForm, skills:profileForm.skills.split(',').map(s=>s.trim()).filter(Boolean), causes:profileForm.causes.split(',').map(s=>s.trim()).filter(Boolean) });
      alert('✅ Profile updated!');
    } catch { alert('Update failed'); }
  };

  const handleAccept = async (id) => {
    try { await acceptMatch(id); setMatches(matches.map(m => m._id===id?{...m,status:'accepted'}:m)); alert('✅ Task accepted!'); } catch { alert('Failed'); }
  };

  const handleReject = async (id) => {
    try { await rejectMatch(id); setMatches(matches.map(m => m._id===id?{...m,status:'rejected'}:m)); } catch { alert('Failed'); }
  };

  const isApproved = user?.volunteerStatus === 'approved' || user?.isVerified;
  const hasApp = myApps.length > 0;
  const latestApp = myApps[0];

  const inputStyle = { width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, outline:'none', boxSizing:'border-box' };
  const TABS = isApproved
    ? [['tasks','🤝 Tasks (' + matches.filter(m=>m.status==='suggested'||m.status==='accepted').length + ')'],['profile','👤 My Profile'],['history','📋 My History']]
    : [['application','📝 Join Application'],['status','📊 Application Status']];

  return (
    <div style={{ minHeight:'100vh', background:'#f5f0ff', fontFamily:'Segoe UI, sans-serif' }}>
      <div style={{ background:'linear-gradient(135deg,#4a148c,#6a1b9a)', color:'#fff', padding:'0 28px', display:'flex', justifyContent:'space-between', alignItems:'center', height:64 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>🙋</span>
          <div>
            <div style={{ fontWeight:800, fontSize:16 }}>Volunteer Portal</div>
            <div style={{ fontSize:12, opacity:0.8 }}>{user?.name} {isApproved ? '• ✅ Approved' : '• ⏳ Pending Approval'}</div>
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
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #e8eaf6', fontWeight:800, color:'#4a148c' }}>Notifications</div>
                {notifications.length === 0 ? <div style={{ padding:24, textAlign:'center', color:'#666' }}>No notifications yet</div>
                  : notifications.map((n, i) => (
                    <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid #f5f0ff' }}>
                      <div style={{ fontWeight:700, fontSize:14, color:'#4a148c' }}>{n.title}</div>
                      <div style={{ fontSize:13, color:'#666', marginTop:2 }}>{n.message}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <button onClick={logout} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', padding:'8px 16px', borderRadius:20, cursor:'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ background:'#fff', padding:'0 28px', display:'flex', gap:4, borderBottom:'2px solid #ede7f6' }}>
        {TABS.map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'14px 20px', border:'none', background:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:tab===t?'#4a148c':'#666', borderBottom:tab===t?'3px solid #4a148c':'3px solid transparent' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding:28, maxWidth:700, margin:'0 auto' }}>

        {/* Application Form */}
        {tab === 'application' && !isApproved && (
          <div>
            {appSuccess && (
              <div style={{ background:'#e8f5e9', border:'1.5px solid #43a047', color:'#1b5e20', padding:18, borderRadius:14, marginBottom:24, fontWeight:600 }}>
                ✅ {appSuccess}
              </div>
            )}
            {hasApp && latestApp?.status === 'pending' ? (
              <div style={{ background:'#fff', padding:28, borderRadius:20, boxShadow:'0 4px 16px rgba(0,0,0,0.07)', textAlign:'center' }}>
                <div style={{ fontSize:56, marginBottom:16 }}>⏳</div>
                <h3 style={{ color:'#4a148c', marginBottom:8 }}>Application Under Review</h3>
                <p style={{ color:'#666', lineHeight:1.6 }}>Your application has been submitted and is being reviewed by the NGO Head. You will receive a notification once a decision is made.</p>
                <div style={{ marginTop:24, padding:16, background:'#f5f0ff', borderRadius:12, textAlign:'left', fontSize:14 }}>
                  <div style={{ fontWeight:800, color:'#4a148c', marginBottom:8 }}>Your Application Summary:</div>
                  <div style={{ color:'#555', lineHeight:1.7 }}>
                    <div>Skills: {latestApp.skills}</div>
                    <div>Experience: {latestApp.experience}</div>
                    <div>Area: {latestApp.area}</div>
                    <div>Submitted: {new Date(latestApp.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background:'#fff', padding:32, borderRadius:20, boxShadow:'0 4px 16px rgba(0,0,0,0.07)' }}>
                <h2 style={{ color:'#4a148c', marginBottom:8, fontWeight:800 }}>🙋 Apply to Join as Volunteer</h2>
                <p style={{ color:'#666', marginBottom:28, fontSize:14, lineHeight:1.6 }}>Fill in this form to apply as a volunteer. The NGO Head will review your application using AI analysis and send you a notification about the decision.</p>
                <form onSubmit={handleSubmitApp} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Why do you want to join? *</label>
                    <textarea value={appForm.whyJoin} onChange={e => setAppForm({...appForm, whyJoin:e.target.value})}
                      style={{ ...inputStyle, height:110, resize:'vertical' }}
                      placeholder="Tell us about your motivation, what drives you to volunteer..." required />
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Your Skills *</label>
                    <input value={appForm.skills} onChange={e => setAppForm({...appForm, skills:e.target.value})}
                      style={inputStyle} placeholder="e.g. First Aid, Cooking, Teaching, Driving, Counseling..." required />
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Previous Experience</label>
                    <textarea value={appForm.experience} onChange={e => setAppForm({...appForm, experience:e.target.value})}
                      style={{ ...inputStyle, height:90, resize:'vertical' }}
                      placeholder="Any previous volunteer work, social service, or relevant experience..." />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Availability</label>
                      <input value={appForm.availability} onChange={e => setAppForm({...appForm, availability:e.target.value})}
                        style={inputStyle} placeholder="e.g. Weekends, Evenings, Full time..." />
                    </div>
                    <div>
                      <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Your Area / City</label>
                      <input value={appForm.area} onChange={e => setAppForm({...appForm, area:e.target.value})}
                        style={inputStyle} placeholder="e.g. Hyderabad, Telangana" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Phone Number</label>
                    <input value={appForm.phone} onChange={e => setAppForm({...appForm, phone:e.target.value})}
                      style={inputStyle} placeholder="+91-XXXXXXXXXX" />
                  </div>
                  <button type="submit" disabled={submitting}
                    style={{ padding:15, background:'linear-gradient(135deg,#4a148c,#6a1b9a)', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:800, cursor:'pointer' }}>
                    {submitting ? '⏳ Submitting...' : '📤 Submit Application'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Application Status */}
        {tab === 'status' && !isApproved && (
          <div>
            <h2 style={{ color:'#4a148c', marginBottom:24, fontWeight:800 }}>📊 Application Status</h2>
            {myApps.length === 0 ? (
              <div style={{ background:'#fff', padding:40, borderRadius:20, textAlign:'center', color:'#666' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📝</div>
                <p>No applications submitted yet.</p>
                <button onClick={() => setTab('application')} style={{ marginTop:12, padding:'10px 24px', background:'#4a148c', color:'#fff', border:'none', borderRadius:20, cursor:'pointer', fontWeight:700 }}>
                  Submit Application
                </button>
              </div>
            ) : myApps.map(app => (
              <div key={app._id} style={{ background:'#fff', padding:24, borderRadius:18, marginBottom:16, boxShadow:'0 4px 16px rgba(0,0,0,0.07)', borderLeft:'5px solid ' + (app.status==='approved'?'#43a047':app.status==='rejected'?'#e53935':'#f59e0b') }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                  <strong style={{ fontSize:15, color:'#4a148c' }}>Volunteer Application</strong>
                  <span style={{ padding:'4px 14px', borderRadius:20, fontSize:13, fontWeight:800, background:app.status==='approved'?'#e8f5e9':app.status==='rejected'?'#ffebee':'#fff8e1', color:app.status==='approved'?'#43a047':app.status==='rejected'?'#e53935':'#f57f17' }}>
                    {app.status.toUpperCase()}
                  </span>
                </div>
                {app.aiSummary && (
                  <div style={{ background:'#f5f0ff', borderRadius:10, padding:14, marginBottom:12, fontSize:13, color:'#4a148c', whiteSpace:'pre-line', lineHeight:1.6 }}>
                    {app.aiSummary}
                  </div>
                )}
                {app.ngoResponse && (
                  <div style={{ background:app.status==='approved'?'#e8f5e9':'#ffebee', borderRadius:10, padding:14, marginBottom:12, fontSize:14, fontWeight:600, color:app.status==='approved'?'#1b5e20':'#c62828' }}>
                    📩 NGO Response: {app.ngoResponse}
                  </div>
                )}
                <div style={{ fontSize:12, color:'#bbb' }}>Submitted: {new Date(app.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tasks */}
        {tab === 'tasks' && isApproved && (
          <div>
            <h2 style={{ color:'#4a148c', marginBottom:20, fontWeight:800 }}>🤝 My Assigned Tasks</h2>
            {matches.filter(m => m.status !== 'rejected').length === 0 ? (
              <div style={{ background:'#fff', padding:40, borderRadius:20, textAlign:'center', color:'#666' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🤝</div>
                <p>No tasks assigned yet. Complete your profile to get matched with community needs.</p>
              </div>
            ) : matches.filter(m => m.status !== 'rejected').map(m => (
              <div key={m._id} style={{ background:'#fff', padding:22, borderRadius:16, marginBottom:14, boxShadow:'0 4px 14px rgba(0,0,0,0.07)', borderLeft:'5px solid ' + (m.status==='accepted'?'#43a047':m.status==='completed'?'#6b7280':'#6a1b9a') }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <strong style={{ fontSize:15, color:'#4a148c' }}>{m.need?.title || 'Task'}</strong>
                  <span style={{ fontSize:22, fontWeight:800, color:'#6a1b9a' }}>{m.compatibilityScore}%</span>
                </div>
                <p style={{ color:'#666', fontSize:13, margin:'4px 0 12px' }}>📍 {m.need?.address} | 🏷️ {m.need?.category}</p>
                <div style={{ display:'flex', gap:16, fontSize:13, color:'#555', marginBottom:14, flexWrap:'wrap' }}>
                  <span>🎯 Skills: {m.skillScore}%</span>
                  <span>📍 {m.distanceKm}km away</span>
                  <span>⏰ Availability: {m.availabilityScore}%</span>
                </div>
                {m.status === 'suggested' && (
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={() => handleAccept(m._id)} style={{ flex:1, padding:'10px 0', background:'#43a047', color:'#fff', border:'none', borderRadius:10, fontWeight:800, cursor:'pointer' }}>✅ Accept</button>
                    <button onClick={() => handleReject(m._id)} style={{ flex:1, padding:'10px 0', background:'#e53935', color:'#fff', border:'none', borderRadius:10, fontWeight:800, cursor:'pointer' }}>❌ Decline</button>
                  </div>
                )}
                {m.status === 'accepted' && <div style={{ color:'#43a047', fontWeight:800 }}>✅ You are working on this task</div>}
                {m.status === 'completed' && <div style={{ color:'#6b7280', fontWeight:800 }}>🏁 Completed</div>}
              </div>
            ))}
          </div>
        )}

        {/* Profile */}
        {tab === 'profile' && isApproved && (
          <div style={{ background:'#fff', padding:32, borderRadius:20, boxShadow:'0 4px 16px rgba(0,0,0,0.07)' }}>
            <h2 style={{ color:'#4a148c', marginBottom:24, fontWeight:800 }}>👤 My Profile</h2>
            <form onSubmit={handleSaveProfile} style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Bio</label>
                <textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio:e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, height:90, resize:'none', boxSizing:'border-box' }}
                  placeholder="Tell us about yourself..." />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Skills (comma separated)</label>
                <input value={profileForm.skills} onChange={e => setProfileForm({...profileForm, skills:e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, boxSizing:'border-box' }}
                  placeholder="e.g. first aid, driving, teaching, cooking" />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:8 }}>Causes I care about</label>
                <input value={profileForm.causes} onChange={e => setProfileForm({...profileForm, causes:e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e8eaf6', fontSize:14, boxSizing:'border-box' }}
                  placeholder="e.g. food, health, education, children" />
              </div>
              <button type="submit" style={{ padding:13, background:'linear-gradient(135deg,#4a148c,#6a1b9a)', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:15, cursor:'pointer' }}>
                💾 Save Profile
              </button>
            </form>
          </div>
        )}

        {/* History */}
        {tab === 'history' && isApproved && (
          <div>
            <h2 style={{ color:'#4a148c', marginBottom:20, fontWeight:800 }}>📋 My History</h2>
            <div style={{ background:'#fff', padding:24, borderRadius:20, boxShadow:'0 4px 16px rgba(0,0,0,0.07)' }}>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap', marginBottom:20 }}>
                {[
                  ['Tasks Accepted', matches.filter(m=>m.status==='accepted'||m.status==='completed').length, '#43a047'],
                  ['Tasks Completed', matches.filter(m=>m.status==='completed').length, '#1a237e'],
                  ['Tasks Declined', matches.filter(m=>m.status==='rejected').length, '#e53935'],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ flex:1, minWidth:120, padding:'16px 20px', background:'#f8faff', borderRadius:12, textAlign:'center', borderLeft:'4px solid '+c }}>
                    <div style={{ fontSize:26, fontWeight:800, color:c }}>{v}</div>
                    <div style={{ fontSize:13, color:'#666', marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ color:'#4a148c', marginBottom:12, fontWeight:700 }}>All Tasks</h3>
              {matches.map(m => (
                <div key={m._id} style={{ padding:'12px 0', borderBottom:'1px solid #f0f4f8', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, color:'#333' }}>{m.need?.title || 'Task'}</div>
                    <div style={{ fontSize:12, color:'#999' }}>{m.need?.category} | {new Date(m.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span style={{ padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:m.status==='accepted'?'#e8f5e9':m.status==='completed'?'#e3f2fd':m.status==='rejected'?'#ffebee':'#fff8e1', color:m.status==='accepted'?'#43a047':m.status==='completed'?'#1565c0':m.status==='rejected'?'#e53935':'#f57f17' }}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}