import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BOT_RESPONSES = {
  'hello': 'Hello! 👋 Welcome to CivicMatch. I can help you understand how our platform works. Ask me anything!',
  'hi': 'Hi there! 👋 How can I help you today? You can ask about User Portal, NGO Head, Team Portal, or Volunteer Portal.',
  'user': 'The User Portal is for community members. You can:\n✅ Report problems in your area\n✅ Track the status of your reports\n✅ Get real-time updates from NGO teams\n✅ Use voice recording to describe your problem',
  'ngo head': 'The NGO Head has full control:\n✅ View ALL community problems\n✅ Run AI analysis on problems and applications\n✅ Assign problems to specialized teams\n✅ Approve or reject volunteers and team members\n✅ Monitor all portals\n✅ View history and analytics',
  'volunteer': 'To become a volunteer:\n1️⃣ Register as a volunteer\n2️⃣ Submit your application with details about your skills\n3️⃣ NGO Head reviews your application using AI\n4️⃣ You receive a notification about the decision\n5️⃣ Once approved, accept tasks from the NGO',
  'team': 'NGO Team members:\n✅ See ONLY their assigned problems\n✅ Update progress in real time\n✅ Users get notified of every update\n✅ Each team handles specific categories like Health, Food, Education',
  'map': 'Our Map View shows:\n🗺️ All active problem locations\n🛰️ Satellite view available\n📍 Click any pin to see problem details\n🔴 Color coded by urgency level',
  'report': 'To report a problem:\n1️⃣ Login as a Community User\n2️⃣ Go to Report Problem tab\n3️⃣ Fill in details or use voice recording 🎤\n4️⃣ Set urgency level and location\n5️⃣ Submit — NGO team will respond',
  'notification': 'Notifications are real-time:\n🔔 Users get updates when team works on their problem\n🔔 Volunteers get notified of application decisions\n🔔 NGO Head gets alerts for new problems and applications',
  'register': 'To register:\n1️⃣ Click Get Started on this page\n2️⃣ Choose your role: User, NGO Head, Team Member, or Volunteer\n3️⃣ Fill in your details\n4️⃣ Note: Team members and volunteers need NGO Head approval',
  'login': 'To login:\n1️⃣ Click Login on this page\n2️⃣ Select your role\n3️⃣ Enter your registered email and password\n4️⃣ You will be directed to your specific portal',
  'default': 'I can answer questions about:\n• User Portal — reporting problems\n• NGO Head — managing the platform\n• Team Portal — handling assigned problems\n• Volunteer Portal — joining as volunteer\n• Map View — seeing problems on map\n• Notifications — real-time updates\n\nWhat would you like to know?',
};

const getBotResponse = (msg) => {
  const m = msg.toLowerCase();
  for (const key of Object.keys(BOT_RESPONSES)) {
    if (m.includes(key)) return BOT_RESPONSES[key];
  }
  return BOT_RESPONSES['default'];
};

function ChatBot() {
  const [open, setOpen]     = useState(false);
  const [messages, setMessages] = useState([{ from:'bot', text:'Hi! I am CivicMatch Assistant 🤖\nHow can I help you today?' }]);
  const [input, setInput]   = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { from:'user', text:input };
    const botMsg  = { from:'bot', text:getBotResponse(input) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:999 }}>
      {open && (
        <div style={{ width:340, height:480, background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column', marginBottom:12, overflow:'hidden' }}>
          <div style={{ background:'linear-gradient(135deg,#1a237e,#1565c0)', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ color:'#fff' }}>
              <div style={{ fontWeight:800, fontSize:15 }}>🤖 CivicMatch Assistant</div>
              <div style={{ fontSize:12, opacity:0.8 }}>Always here to help</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', width:28, height:28, borderRadius:'50%', cursor:'pointer', fontSize:14 }}>✕</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10, background:'#f8faff' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.from==='user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth:'80%', padding:'10px 14px', borderRadius: m.from==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.from==='user' ? '#1a237e' : '#fff', color: m.from==='user' ? '#fff' : '#333', fontSize:13, lineHeight:1.6, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', whiteSpace:'pre-line' }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div style={{ padding:'12px 16px', background:'#fff', borderTop:'1px solid #e8eaf6', display:'flex', gap:8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && send()}
              placeholder="Ask anything..." style={{ flex:1, padding:'10px 14px', borderRadius:20, border:'1.5px solid #e8eaf6', fontSize:13, outline:'none' }} />
            <button onClick={send} style={{ background:'#1a237e', border:'none', color:'#fff', width:38, height:38, borderRadius:'50%', cursor:'pointer', fontSize:16 }}>➤</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg,#1a237e,#1565c0)', border:'none', color:'#fff', fontSize:26, cursor:'pointer', boxShadow:'0 8px 24px rgba(26,35,126,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {open ? '✕' : '🤖'}
      </button>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0a0f2e 0%,#1a237e 50%,#1565c0 100%)', color:'#fff', fontFamily:'Segoe UI, sans-serif' }}>

      {/* Navbar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 48px', position:'sticky', top:0, background:'rgba(10,15,46,0.9)', backdropFilter:'blur(10px)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:28 }}>🌍</span>
          <span style={{ fontWeight:900, fontSize:22, letterSpacing:'-0.5px' }}>CivicMatch</span>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={() => navigate('/login')} style={{ padding:'10px 24px', background:'transparent', color:'#fff', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:30, fontWeight:700, fontSize:14, cursor:'pointer' }}>
            Login
          </button>
          <button onClick={() => navigate('/register')} style={{ padding:'10px 24px', background:'#fff', color:'#1a237e', border:'none', borderRadius:30, fontWeight:800, fontSize:14, cursor:'pointer' }}>
            Get Started
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign:'center', padding:'100px 48px 80px' }}>
        <div style={{ display:'inline-block', background:'rgba(255,255,255,0.1)', borderRadius:30, padding:'6px 20px', fontSize:13, fontWeight:700, marginBottom:24, border:'1px solid rgba(255,255,255,0.2)' }}>
          🚀 Smart Resource Allocation Platform
        </div>
        <h1 style={{ fontSize:60, fontWeight:900, lineHeight:1.1, marginBottom:24, letterSpacing:'-2px' }}>
          Connecting Communities<br />
          <span style={{ background:'linear-gradient(135deg,#42a5f5,#00e5ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            with Real Solutions
          </span>
        </h1>
        <p style={{ fontSize:20, opacity:0.8, maxWidth:600, margin:'0 auto 48px', lineHeight:1.7 }}>
          AI-powered platform connecting NGOs, volunteers, and communities to solve real-world problems efficiently and transparently.
        </p>
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/register')} style={{ padding:'16px 40px', background:'#fff', color:'#1a237e', border:'none', borderRadius:30, fontWeight:800, fontSize:16, cursor:'pointer', boxShadow:'0 8px 30px rgba(255,255,255,0.2)' }}>
            Start for Free →
          </button>
          <button onClick={() => navigate('/login')} style={{ padding:'16px 40px', background:'transparent', color:'#fff', border:'2px solid rgba(255,255,255,0.4)', borderRadius:30, fontWeight:700, fontSize:16, cursor:'pointer' }}>
            Sign In
          </button>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding:'60px 48px', maxWidth:1200, margin:'0 auto' }}>
        <h2 style={{ textAlign:'center', fontSize:36, fontWeight:800, marginBottom:48 }}>Everything you need</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:24 }}>
          {[
            ['🗣️', 'Voice Problem Reporting', 'Record voice notes to describe community problems. AI transcribes and analyses them instantly.'],
            ['🤖', 'AI-Powered Analysis', 'Every problem and volunteer application is scored and analysed by AI for faster, smarter decisions.'],
            ['🗺️', 'Satellite Map View', 'View all problems on an interactive map with satellite imagery and urgency-based pins.'],
            ['🔔', 'Real-time Notifications', 'Every update is pushed instantly to the right portal — users, teams, and volunteers stay in sync.'],
            ['👥', 'Team Management', 'NGO Head manages separate teams. Each team sees only their assigned problems.'],
            ['📊', 'Impact Analytics', 'Track resolved problems, volunteer hours, team performance, and community impact over time.'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:28, backdropFilter:'blur(10px)' }}>
              <div style={{ fontSize:36, marginBottom:14 }}>{icon}</div>
              <h3 style={{ fontSize:16, fontWeight:800, marginBottom:8 }}>{title}</h3>
              <p style={{ opacity:0.75, fontSize:14, lineHeight:1.6, margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Portals */}
      <div style={{ padding:'60px 48px', background:'rgba(255,255,255,0.04)', margin:'40px 0' }}>
        <h2 style={{ textAlign:'center', fontSize:36, fontWeight:800, marginBottom:12 }}>Four Separate Portals</h2>
        <p style={{ textAlign:'center', opacity:0.7, marginBottom:48, fontSize:16 }}>Each role has its own secure, dedicated interface</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20, maxWidth:1000, margin:'0 auto' }}>
          {[
            { icon:'👤', title:'Community User', color:'#42a5f5', desc:'Report problems and track resolution in real time' },
            { icon:'🏢', title:'NGO Head', color:'#66bb6a', desc:'Full control — AI analysis, team assignment, approvals' },
            { icon:'👥', title:'NGO Team', color:'#ffa726', desc:'Handle assigned problems and update progress' },
            { icon:'🙋', title:'Volunteer', color:'#ab47bc', desc:'Apply, get approved, and contribute to the community' },
          ].map((p) => (
            <div key={p.title} onClick={() => navigate('/login')} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid ' + p.color + '40', borderRadius:20, padding:28, cursor:'pointer', textAlign:'center', transition:'transform 0.2s' }}>
              <div style={{ fontSize:44, marginBottom:12 }}>{p.icon}</div>
              <div style={{ fontWeight:800, color:p.color, fontSize:16, marginBottom:8 }}>{p.title}</div>
              <p style={{ opacity:0.75, fontSize:13, lineHeight:1.5, margin:0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', padding:'40px 48px', opacity:0.5, fontSize:14 }}>
        © 2024 CivicMatch — Smart Resource Allocation Platform. Built for Communities.
      </div>

      <ChatBot />
    </div>
  );
}