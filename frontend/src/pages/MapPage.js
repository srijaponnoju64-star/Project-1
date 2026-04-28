import React, { useEffect, useState } from 'react';
import { getNeeds } from '../services/api';

export default function MapPage() {
  const [needs, setNeeds] = useState([]);

  useEffect(() => { getNeeds().then(r => setNeeds(r.data?.data || r.data || [])).catch(() => {}); }, []);

  const urgencyColor = { critical:'#e53935', high:'#fb8c00', medium:'#fdd835', low:'#43a047' };

  return (
    <div>
      <h2 style={{ color:'#1a237e', marginBottom:8 }}>🗺️ Community Needs Map</h2>
      <p style={{ color:'#666', marginBottom:20 }}>Showing {needs.length} active needs across the region</p>

      <div style={{ background:'#e8eaf6', borderRadius:12, padding:20, marginBottom:20, textAlign:'center', minHeight:300, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
        <div style={{ fontSize:60 }}>🗺️</div>
        <p style={{ color:'#1a237e', fontWeight:'bold' }}>Interactive Map</p>
        <p style={{ color:'#666', fontSize:14 }}>Install: npm install react-leaflet leaflet<br />Then restart and the map will appear here</p>
      </div>

      <h3 style={{ color:'#1a237e', marginBottom:12 }}>📍 Needs by Location</h3>
      {needs.map(n => (
        <div key={n._id} style={{ background:'#fff', padding:14, borderRadius:10, marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:14, height:14, borderRadius:'50%', background:urgencyColor[n.urgencyLevel], flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <strong>{n.title}</strong>
            <p style={{ color:'#666', fontSize:13 }}>📍 {n.address} | 👥 {n.peopleAffected} people</p>
          </div>
          <span style={{ background:'#e8eaf6', color:'#1a237e', padding:'3px 10px', borderRadius:12, fontSize:12 }}>{n.category}</span>
        </div>
      ))}
    </div>
  );
}