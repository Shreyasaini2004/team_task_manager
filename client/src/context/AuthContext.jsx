import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      if (!getToken()) return;

      try {
        const data = await api.me();
        if (mounted) setUser(data.user);
      } catch (_error) {
        setToken(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    if (!getToken()) {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  async function login(credentials) {
    const data = await api.login(credentials);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(payload) {
    const data = await api.signup(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
