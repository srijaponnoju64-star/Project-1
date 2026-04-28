import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getMe } from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();
let socket = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [token, setToken]         = useState(localStorage.getItem('token'));
  const [loading, setLoading]     = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  useEffect(() => {
    if (token) {
      getMe()
        .then(res => {
          setUser(res.data.user);
          connectSocket(res.data.user.id);
        })
        .catch(() => { localStorage.removeItem('token'); setToken(null); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const connectSocket = (userId) => {
    if (socket) socket.disconnect();
    socket = io('https://project-1-backend-ejbo.onrender.com/api');
    socket.on('connect', () => socket.emit('join_room', userId));
    socket.on('notification', (notif) => {
      setNotifications(prev => [{ ...notif, id: Date.now(), createdAt: new Date() }, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    socket.on('problem_status_changed', (data) => {
      window.dispatchEvent(new CustomEvent('problem_updated', { detail: data }));
    });
  };

  const loginUser = (data) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.user.id);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (socket) { socket.disconnect(); socket = null; }
    setNotifications([]);
    setUnreadCount(0);
  };

  const clearUnread = () => setUnreadCount(0);

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logout, loading, notifications, unreadCount, clearUnread, socket }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);