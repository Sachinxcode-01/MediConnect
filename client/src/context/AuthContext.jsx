import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { sanitizeInput } from '../utils/validation';

export const AuthContext = createContext();

// Secure token storage with expiry
const TOKEN_KEY = 'accessToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const storage = {
  getToken: () => {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry)) {
      storage.clearToken();
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, Date.now() + TOKEN_EXPIRY_MS);
  },
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = storage.getToken();
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Auth check failed', error);
          storage.clearToken();
          if (error.response?.status !== 401) {
            toast.error('Session expired. Please log in again.');
          }
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email, password, deviceFingerprint) => {
    // Input validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const res = await api.post('/api/auth/login', {
      email: sanitizeInput(email),
      password,
      deviceFingerprint
    });
    if (!res.data?.accessToken) {
      throw new Error('Invalid response from server');
    }
    storage.setToken(res.data.accessToken);
    setUser(res.data);
    return res.data;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    // Input validation
    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      throw new Error('Password must be at least 8 characters with letters and numbers');
    }
    if (!['patient', 'doctor', 'admin'].includes(role)) {
      throw new Error('Invalid role selected');
    }

    const res = await api.post('/api/auth/register', {
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      password,
      role
    });
    if (!res.data?.accessToken) {
      throw new Error('Invalid response from server');
    }
    storage.setToken(res.data.accessToken);
    setUser(res.data);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      storage.clearToken();
      setUser(null);
      toast.success('Logged out successfully');
    }
  }, []);

  const setSession = useCallback((sessionUser, token) => {
    if (token) storage.setToken(token);
    if (sessionUser) setUser(sessionUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setSession, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
