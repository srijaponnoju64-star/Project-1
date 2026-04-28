const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use((req, res, next) => { req.io = io; next(); });

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/ngos',         require('./routes/ngos'));
app.use('/api/needs',        require('./routes/needs'));
app.use('/api/volunteers',   require('./routes/volunteers'));
app.use('/api/matches',      require('./routes/matches'));
app.use('/api/analytics',    require('./routes/analytics'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/problems',     require('./routes/problems'));
app.use('/api/applications', require('./routes/applications'));

app.get('/api/health', (req, res) => res.json({ status: '✅ CivicMatch API running', time: new Date() }));

// Real-time socket
io.on('connection', (socket) => {
  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log('User joined room:', userId);
  });
  socket.on('send_notification', ({ recipientId, notification }) => {
    io.to(recipientId).emit('notification', notification);
  });
  socket.on('problem_updated', ({ problemId, status, progress }) => {
    io.emit('problem_status_changed', { problemId, status, progress });
  });
  socket.on('disconnect', () => {});
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    server.listen(process.env.PORT || 5000, () =>
      console.log('🚀 Server running on port ' + (process.env.PORT || 5000))
    );
  })
  .catch((err) => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });

module.exports = { io };