import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('jobby_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jobby_user') || 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        localStorage.setItem('jobby_user', JSON.stringify(data.user));
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem('jobby_token');
        localStorage.removeItem('jobby_user');
        setToken(null); setUser(null);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('jobby_token', data.token);
    localStorage.setItem('jobby_user', JSON.stringify(data.user));
    setToken(data.token); setUser(data.user);
    return data.user;
  };

  const register = async (details) => {
    const { data } = await api.post('/auth/register', details);
    localStorage.setItem('jobby_token', data.token);
    localStorage.setItem('jobby_user', JSON.stringify(data.user));
    setToken(data.token); setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('jobby_token');
    localStorage.removeItem('jobby_user');
    setToken(null); setUser(null);
  };

  const value = useMemo(() => ({ token, user, loading, login, register, logout }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
