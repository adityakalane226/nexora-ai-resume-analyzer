import { createContext, useContext, useState, useCallback } from 'react';
import { loginUser, registerUser, getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexora_user')); }
    catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await loginUser({ email, password });
    const { token, user: userData } = data.data;
    localStorage.setItem('nexora_token', token);
    localStorage.setItem('nexora_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await registerUser({ name, email, password });
    const { token, user: userData } = data.data;
    localStorage.setItem('nexora_token', token);
    localStorage.setItem('nexora_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await getMe();
      setUser(data.data.user);
      localStorage.setItem('nexora_user', JSON.stringify(data.data.user));
    } catch { logout(); }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
