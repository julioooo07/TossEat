import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : ''),
  timeout: 10000,
});

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      const response = await api.get('/api/validate');
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

const login = async (email, password) => {
  try {
    const response = await api.post('/api/login', { email, password });

    if (response.data.success) {
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user_id', user._id);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      // Check if this is first login (no previous preferences stored)
      const hasPreferences = localStorage.getItem(`preferences_${user._id}`);
      const isFirstLogin = !hasPreferences;
      
      // Return additional info for chatbot trigger
      return { 
        success: true, 
        user,
        isFirstLogin 
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Login failed',
      };
    }
  } catch (error) {
    const message =
      error.response?.data?.message ||
      'Network error. Please check if backend is running.';
    return { success: false, message };
  }
};

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/api/register', { name, email, password });

      if (response.data.success) {
        return { success: true };
      } else {
        return {
          success: false,
          message: response.data.message || 'Registration failed',
        };
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    api 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
