import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getProfile } from '../api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (localStorage.getItem('access')) {
        try { const { data } = await getProfile(); setUser(data); }
        catch { localStorage.clear(); }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await apiLogin({ email, password });
    localStorage.setItem('access',  data.access);
    localStorage.setItem('refresh', data.refresh);
    const { data: me } = await getProfile();
    setUser(me);
    return me;
  };

  const logout = () => { localStorage.clear(); setUser(null); };

  const refreshUser = async () => {
    const { data } = await getProfile();
    setUser(data);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
