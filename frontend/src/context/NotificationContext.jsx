import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const prevCountRef = useRef(0);
  const isFirstFetchRef = useRef(true);

  const playChime = useCallback((role) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume().then(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (role === 'driver') {
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
          osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.16);
          osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.24);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        } else {
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        }
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        setTimeout(() => { try { ctx.close(); } catch(e) {} }, 600);
      });
    } catch (e) { /* audio not available */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const newCount = data.unreadCount || 0;
        setNotifications(data.notifications || []);
        // Skip chime on first fetch to avoid playing on page load
        if (!isFirstFetchRef.current && newCount > prevCountRef.current) {
          playChime(user?.role);
        }
        isFirstFetchRef.current = false;
        prevCountRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  }, [token, playChime, user?.role]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (ids = []) => {
    if (!token) return;
    try {
      await fetch('/api/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids })
      });
      fetchNotifications();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const clearAll = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/clear', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setUnreadCount(0);
      prevCountRef.current = 0;
    } catch (err) {
      console.error('Clear notifications error:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, isOpen, setIsOpen,
      fetchNotifications, markAsRead, clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
