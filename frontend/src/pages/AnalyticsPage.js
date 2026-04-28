import React, { useEffect, useState } from 'react';
import { getAnalyticsOverview, getNeedsByCategory, getMonthlyTrend, getTopVolunteers } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ['#1a237e','#e53935','#43a047','#fb8c00','#6a1b9a','#00838f','#1565c0'];
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AnalyticsPage() {
  const [stats, setStats]     = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [trend, setTrend]     = useState([]);
  const [topVols, setTopVols] = useState([]);

  useEffect(() => {
    getAnalyticsOverview().then(r => setStats(r.data.stats)).catch(() => {});
    getNeedsByCategory().then(r => setByCategory(r.data.data.map(d => ({ name: d._id, value: d.count, completed: d.completed })))).catch(() => {});
    getMonthlyTrend().then(r => setTrend(r.data.data.map(d => ({ name: `${MONTHS[d._id.month]} ${d._id.year}`, needs: d.count })))).catch(() => {});
    getTopVolunteers().then(r => setTopVols(r.data.data)).catch(() => {});
  }, []);

  if (!stats) return <div style={{ padding:40, color:'#666' }}>Loading analytics...</div>;

  return (
    <div>
      <h2 style={{ color:'#1a237e', marginBottom:24 }}>📊 Impact Analytics</h2>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:32 }}>
        {[
          ['Total Needs', stats.totalNeeds, '#1a237e'],
          ['Active', stats.activeNeeds, '#e53935'],
          ['Completed', stats.completedNeeds, '#43a047'],
          ['Volunteers', stats.totalVolunteers, '#6a1b9a'],
          ['NGOs', stats.totalNGOs, '#00838f'],
          ['Matches', stats.totalMatches, '#fb8c00'],
          ['People Helped', stats.peopleHelped, '#e65100'],
          ['Success Rate', `${stats.matchSuccessRate}%`, '#1565c0'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background:'#fff', padding:'18px 22px', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', minWidth:120, borderTop:`4px solid ${color}`, textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:'bold', color }}>{val ?? 0}</div>
            <div style={{ fontSize:12, color:'#666', marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
        <div style={{ background:'#fff', padding:24, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ marginBottom:16, color:'#1a237e' }}>Needs by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCategory}>
              <XAxis dataKey="name" tick={{ fontSize:11 }} /><YAxis /><Tooltip />
              <Bar dataKey="value" name="Total" fill="#1a237e" radius={[4,4,0,0]} />
              <Bar dataKey="completed" name="Completed" fill="#43a047" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:'#fff', padding:24, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ marginBottom:16, color:'#1a237e' }}>Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:'#fff', padding:24, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', marginBottom:24 }}>
        <h3 style={{ marginBottom:16, color:'#1a237e' }}>Monthly Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize:11 }} /><YAxis /><Tooltip />
            <Line type="monotone" dataKey="needs" stroke="#1a237e" strokeWidth={2} dot={{ r:4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:'#fff', padding:24, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
        <h3 style={{ marginBottom:16, color:'#1a237e' }}>🏆 Top Volunteers</h3>
        {topVols.map((v, i) => (
          <div key={v._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'1px solid #f0f0f0' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:['#fdd835','#bdbdbd','#cd7f32'][i] || '#e8eaf6', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:14 }}>{i+1}</div>
            <div style={{ flex:1 }}>
              <strong>{v.user?.name}</strong>
              <p style={{ fontSize:12, color:'#666' }}>{v.totalTasksCompleted} tasks · {v.totalHoursVolunteered}h volunteered</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontWeight:'bold', color:'#43a047' }}>{v.impactPoints} pts</div>
              <div style={{ fontSize:12, color:'#666' }}>Reliability {v.reliabilityScore}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}