import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('smartoptix_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem('smartoptix_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, phone) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem('smartoptix_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('smartoptix_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async (newToken) => {
    if (newToken) {
      localStorage.setItem('smartoptix_token', newToken);
      setToken(newToken);
    }
    // Re-fetch profile with the current/new token
    const activeToken = newToken || token;
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) { console.error('refreshUser error:', err); }
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout, refreshUser,
      isAdmin: user?.role === 'admin',
      isDriver: user?.role === 'driver',
      isClient: user?.role === 'client',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
