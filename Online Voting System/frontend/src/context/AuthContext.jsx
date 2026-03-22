import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then((user) => setUser(user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = (email, password) => {
    return authApi.login({ email, password })
      .then((response) => {
        const { user, token } = response;
        localStorage.setItem('token', token);
        setUser(user);
        return user;
      })
      .catch((error) => {
        // Re-throw with proper error message
        throw error;
      });
  };

  const register = (data) => {
    return authApi.register(data)
      .then((response) => {
        const { user, token } = response;
        localStorage.setItem('token', token);
        setUser(user);
        return user;
      })
      .catch((error) => {
        // Re-throw with proper error message
        throw error;
      });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
