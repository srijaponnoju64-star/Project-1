import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { to:'/dashboard', icon:'🏠', label:'Dashboard' },
    { to:'/needs',     icon:'📋', label:'Needs' },
    { to:'/matches',   icon:'🤝', label:'My Matches' },
    { to:'/map',       icon:'🗺️', label:'Map View' },
    { to:'/analytics', icon:'📊', label:'Analytics' },
    ...(user?.role === 'admin'     ? [{ to:'/admin',             icon:'⚙️', label:'Admin Panel' }]   : []),
    ...(user?.role === 'volunteer' ? [{ to:'/volunteer-profile', icon:'👤', label:'My Profile' }]    : []),
    ...(user?.role === 'ngo'       ? [{ to:'/ngo-profile',       icon:'🏢', label:'NGO Profile' }]   : []),
    ...(user?.role === 'ngo'       ? [{ to:'/needs/create',      icon:'➕', label:'Post Need' }]     : []),
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'Segoe UI, sans-serif' }}>
      <nav style={{ width:220, background:'#1a237e', color:'#fff', padding:'16px 0', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, overflowY:'auto' }}>
        <div style={{ padding:'0 20px 20px', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize:18, fontWeight:'bold', margin:0 }}>🌍 CivicMatch</h2>
          <p style={{ fontSize:12, opacity:0.7, marginTop:4 }}>{user?.name}</p>
          <span style={{ fontSize:11, background:'rgba(255,255,255,0.2)', padding:'2px 8px', borderRadius:10 }}>{user?.role}</span>
        </div>

        <div style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2 }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8,
                color:'#fff', textDecoration:'none', fontSize:14,
                background: location.pathname === link.to ? 'rgba(255,255,255,0.2)' : 'transparent',
                transition:'background 0.2s',
              }}
            >
              <span style={{ fontSize:18 }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        <div style={{ padding:'16px 8px 0', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{ width:'100%', padding:'10px 12px', background:'#e53935', color:'#fff', border:'none', borderRadius:8, display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:14 }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </nav>

      <main style={{ flex:1, marginLeft:220, padding:28, background:'#f0f2f5', minHeight:'100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}