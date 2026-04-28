import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value:'user',      label:'Community User',  icon:'👤', color:'#42a5f5', desc:'I want to report community problems' },
  { value:'ngo_head',  label:'NGO Head',        icon:'🏢', color:'#66bb6a', desc:'I manage an NGO organization' },
  { value:'ngo_team',  label:'NGO Team Member', icon:'👥', color:'#ffa726', desc:'I am part of an NGO team (needs approval)' },
  { value:'volunteer', label:'Volunteer',        icon:'🙋', color:'#ab47bc', desc:'I want to volunteer (needs approval)' },
];

export default function RegisterPage() {
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({ name:'', email:'', password:'', confirmPassword:'', role:'', organizationName:'', teamName:'', phone:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    setError('');
    try {
      const res = await register(form);
      if (form.role === 'ngo_team' || form.role === 'volunteer') {
        navigate('/login');
        alert('Registration submitted! Your account is pending approval from the NGO Head. You will receive a notification once reviewed.');
        return;
      }
      loginUser(res.data);
      if (form.role === 'user')     navigate('/user-portal');
      if (form.role === 'ngo_head') navigate('/ngo-head');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === form.role);
  const inputStyle = { padding:'13px 16px', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:15, outline:'none', width:'100%', boxSizing:'border-box' };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0a0f2e,#1a237e,#1565c0)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Segoe UI, sans-serif', padding:20 }}>
      <div style={{ marginBottom:28, textAlign:'center', cursor:'pointer' }} onClick={() => navigate('/')}>
        <div style={{ fontSize:40 }}>🌍</div>
        <div style={{ color:'#fff', fontWeight:900, fontSize:22, marginTop:6 }}>CivicMatch</div>
      </div>

      {step === 1 ? (
        <div style={{ width:'100%', maxWidth:640 }}>
          <h2 style={{ color:'#fff', textAlign:'center', marginBottom:8, fontSize:22, fontWeight:800 }}>Choose Your Role</h2>
          <p style={{ color:'rgba(255,255,255,0.6)', textAlign:'center', marginBottom:32, fontSize:15 }}>Select how you will use CivicMatch</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {ROLES.map(r => (
              <button key={r.value} onClick={() => { setForm({...form, role:r.value}); setStep(2); }}
                style={{ background: form.role===r.value ? r.color+'30' : 'rgba(255,255,255,0.06)', border:'2px solid ' + r.color + '50', borderRadius:20, padding:'24px 20px', cursor:'pointer', textAlign:'center', backdropFilter:'blur(10px)' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>{r.icon}</div>
                <div style={{ fontWeight:800, color:r.color, fontSize:15, marginBottom:6 }}>{r.label}</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.4 }}>{r.desc}</div>
              </button>
            ))}
          </div>
          <p style={{ color:'rgba(255,255,255,0.5)', textAlign:'center', marginTop:24, fontSize:14 }}>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} style={{ color:'#42a5f5', cursor:'pointer', fontWeight:700 }}>Sign in</span>
          </p>
        </div>
      ) : (
        <div style={{ background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.15)', padding:40, borderRadius:24, width:'100%', maxWidth:460 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
            <button onClick={() => setStep(1)} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:13 }}>← Back</button>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:24 }}>{selectedRole?.icon}</span>
              <span style={{ color:'#fff', fontWeight:800, fontSize:16 }}>Register as {selectedRole?.label}</span>
            </div>
          </div>
          {error && <div style={{ background:'rgba(229,57,53,0.2)', border:'1px solid #e53935', color:'#ffcdd2', padding:12, borderRadius:12, marginBottom:16, fontSize:14 }}>{error}</div>}
          {(form.role === 'ngo_team' || form.role === 'volunteer') && (
            <div style={{ background:'rgba(255,167,38,0.15)', border:'1px solid #ffa726', borderRadius:12, padding:12, marginBottom:16, fontSize:13, color:'#ffe082' }}>
              ⚠️ Your account requires NGO Head approval before you can login.
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} style={inputStyle} required />
            <input placeholder="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} style={inputStyle} required />
            <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} style={inputStyle} />
            <input placeholder="Password (min 6 chars)" type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} style={inputStyle} required />
            <input placeholder="Confirm Password" type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword:e.target.value})} style={inputStyle} required />
            {form.role === 'ngo_head' && (
              <input placeholder="Organization Name" value={form.organizationName} onChange={e => setForm({...form, organizationName:e.target.value})} style={inputStyle} required />
            )}
            {form.role === 'ngo_team' && (
              <input placeholder="Your Team Name (e.g. Health Team)" value={form.teamName} onChange={e => setForm({...form, teamName:e.target.value})} style={inputStyle} />
            )}
            <button type="submit" disabled={loading}
              style={{ padding:14, background:'linear-gradient(135deg,' + (selectedRole?.color||'#1a237e') + ',' + (selectedRole?.color||'#1a237e') + 'aa)', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:800, cursor:'pointer', marginTop:4 }}>
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}