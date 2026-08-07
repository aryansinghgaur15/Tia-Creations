import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || window.location.origin;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('tia_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed.user);
        setToken(parsed.accessToken);
      } catch { localStorage.removeItem('tia_auth'); }
    }
    setLoading(false);
  }, []);

  const persist = useCallback((u, t) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('tia_auth', JSON.stringify({ user: u, accessToken: t }));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    persist(data.user, data.accessToken);
    return data.user;
  }, [persist]);

  const register = useCallback(async ({ email, password, fullName, displayName }) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, displayName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    persist(data.user, data.accessToken);
    return data.user;
  }, [persist]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tia_auth');
  }, []);

  const hasScope = useCallback((scope) => {
    if (!user || !user.scopes) return false;
    const list = Array.isArray(user.scopes) ? user.scopes : JSON.parse(user.scopes || '[]');
    return list.includes(scope);
  }, [user]);

  const isArtist = user?.artistStatus === 'approved';
  const isAdmin = user?.role === 'admin';
  const isPending = user?.artistStatus === 'pending';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, hasScope, isArtist, isAdmin, isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
