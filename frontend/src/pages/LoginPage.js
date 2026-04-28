import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value:'user',      label:'Community User',    icon:'👤', color:'#42a5f5', desc:'Report and track community problems' },
  { value:'ngo_head',  label:'NGO Head',          icon:'🏢', color:'#66bb6a', desc:'Manage the entire NGO platform' },
  { value:'ngo_team',  label:'NGO Team Member',   icon:'👥', color:'#ffa726', desc:'Work on problems assigned to your team' },
  { value:'volunteer', label:'Volunteer',          icon:'🙋', color:'#ab47bc', desc:'Join and contribute as a volunteer' },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('');
  const [form, setForm]     = useState({ email:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      loginUser(res.data);
      const role = res.data.user.role;
      if (role === 'user')      navigate('/user-portal');
      else if (role === 'ngo_head')  navigate('/ngo-head');
      else if (role === 'ngo_team')  navigate('/team-portal');
      else if (role === 'volunteer') navigate('/volunteer-portal');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const role = ROLES.find(r => r.value === selectedRole);

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0a0f2e,#1a237e,#1565c0)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Segoe UI, sans-serif', padding:20 }}>
      <div style={{ marginBottom:32, textAlign:'center', cursor:'pointer' }} onClick={() => navigate('/')}>
        <div style={{ fontSize:44 }}>🌍</div>
        <div style={{ color:'#fff', fontWeight:900, fontSize:24, marginTop:8 }}>CivicMatch</div>
      </div>

      {!selectedRole ? (
        <div style={{ width:'100%', maxWidth:640 }}>
          <h2 style={{ color:'#fff', textAlign:'center', marginBottom:8, fontSize:22, fontWeight:800 }}>Select Your Role</h2>
          <p style={{ color:'rgba(255,255,255,0.6)', textAlign:'center', marginBottom:32, fontSize:15 }}>Choose the portal you want to access</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {ROLES.map(r => (
              <button key={r.value} onClick={() => setSelectedRole(r.value)}
                style={{ background:'rgba(255,255,255,0.08)', border:'2px solid ' + r.color + '40', borderRadius:20, padding:'24px 20px', cursor:'pointer', textAlign:'center', backdropFilter:'blur(10px)', transition:'all 0.2s' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>{r.icon}</div>
                <div style={{ fontWeight:800, color:r.color, fontSize:15, marginBottom:6 }}>{r.label}</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.4 }}>{r.desc}</div>
              </button>
            ))}
          </div>
          <p style={{ color:'rgba(255,255,255,0.5)', textAlign:'center', marginTop:24, fontSize:14 }}>
            New here?{' '}
            <span onClick={() => navigate('/register')} style={{ color:'#42a5f5', cursor:'pointer', fontWeight:700 }}>Create an account</span>
          </p>
        </div>
      ) : (
        <div style={{ background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.15)', padding:40, borderRadius:24, width:'100%', maxWidth:420 }}>
          <button onClick={() => setSelectedRole('')} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:13, marginBottom:24, display:'flex', alignItems:'center', gap:6 }}>
            ← Back
          </button>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ fontSize:44 }}>{role?.icon}</div>
            <h2 style={{ color:'#fff', marginTop:10, fontWeight:800, fontSize:20 }}>{role?.label} Login</h2>
          </div>
          {error && (
            <div style={{ background:'rgba(229,57,53,0.2)', border:'1px solid #e53935', color:'#ffcdd2', padding:12, borderRadius:12, marginBottom:16, fontSize:14 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <input placeholder="Email address" type="email" value={form.email}
              onChange={e => setForm({...form, email:e.target.value})}
              style={{ padding:'13px 16px', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:15, outline:'none' }} required />
            <input placeholder="Password" type="password" value={form.password}
              onChange={e => setForm({...form, password:e.target.value})}
              style={{ padding:'13px 16px', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:15, outline:'none' }} required />
            <button type="submit" disabled={loading}
              style={{ padding:14, background:'linear-gradient(135deg,' + (role?.color||'#1a237e') + ',' + (role?.color||'#1a237e') + 'aa)', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:800, cursor:'pointer', marginTop:4 }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:20, color:'rgba(255,255,255,0.5)', fontSize:14 }}>
            No account?{' '}
            <span onClick={() => navigate('/register')} style={{ color:'#42a5f5', cursor:'pointer', fontWeight:700 }}>Register here</span>
          </p>
        </div>
      )}
    </div>
  );
}