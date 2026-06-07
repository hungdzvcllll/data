import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as loginApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('educare_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('educare_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('educare_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('educare_token');
        localStorage.removeItem('educare_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    localStorage.setItem('educare_token', res.data.token);
    localStorage.setItem('educare_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('educare_token');
    localStorage.removeItem('educare_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
