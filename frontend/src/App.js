import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage     from './pages/LandingPage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import UserPortal      from './pages/UserPortal';
import NGOHeadPortal   from './pages/NGOHeadPortal';
import TeamPortal      from './pages/TeamPortal';
import VolunteerPortal from './pages/VolunteerPortal';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'linear-gradient(135deg,#1a237e,#1565c0)', flexDirection:'column', gap:20 }}>
      <div style={{ fontSize:60 }}>🌍</div>
      <div style={{ color:'#fff', fontSize:22, fontWeight:'bold' }}>CivicMatch</div>
      <div style={{ color:'rgba(255,255,255,0.7)', fontSize:15 }}>Loading your portal...</div>
      <div style={{ width:50, height:50, border:'4px solid rgba(255,255,255,0.3)', borderTop:'4px solid #fff', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/user-portal"      element={<PrivateRoute allowedRoles={['user']}     ><UserPortal /></PrivateRoute>} />
          <Route path="/ngo-head"         element={<PrivateRoute allowedRoles={['ngo_head']} ><NGOHeadPortal /></PrivateRoute>} />
          <Route path="/team-portal"      element={<PrivateRoute allowedRoles={['ngo_team']} ><TeamPortal /></PrivateRoute>} />
          <Route path="/volunteer-portal" element={<PrivateRoute allowedRoles={['volunteer']}><VolunteerPortal /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}