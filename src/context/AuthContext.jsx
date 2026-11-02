import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('wce_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('wce_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (e) {
          localStorage.removeItem('wce_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, pass) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      localStorage.setItem('wce_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    setIsLoading(true);
    try {
      const res = await api.register(formData);
      localStorage.setItem('wce_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('wce_token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (token) {
      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch (e) {
        console.warn('Failed to refresh profile:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
