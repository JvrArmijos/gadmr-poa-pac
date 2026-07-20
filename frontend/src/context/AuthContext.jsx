// AuthContext.jsx - Contexto global para sesión de usuario y autenticación
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión persistente al cargar la app
    const savedUser = localStorage.getItem('gadmr_user');
    const token = localStorage.getItem('gadmr_access_token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    
    setLoading(false);
  }, []);

  // Iniciar Sesión (Login)
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: loggedUser, accessToken, refreshToken } = response.data;
      
      setUser(loggedUser);
      localStorage.setItem('gadmr_user', JSON.stringify(loggedUser));
      localStorage.setItem('gadmr_access_token', accessToken);
      localStorage.setItem('gadmr_refresh_token', refreshToken);
      
      return loggedUser;
    } catch (error) {
      throw error; // Re-lanzar error formateado por el api.js
    }
  };

  // Registrar Usuario
  const register = async ({ nombre, email, password, roleId, direccionId }) => {
    try {
      const response = await api.post('/auth/register', { 
        nombre, 
        email, 
        password, 
        roleId, 
        direccionId: direccionId ? Number(direccionId) : null 
      });
      const { user: registeredUser, accessToken, refreshToken } = response.data;
      
      setUser(registeredUser);
      localStorage.setItem('gadmr_user', JSON.stringify(registeredUser));
      localStorage.setItem('gadmr_access_token', accessToken);
      localStorage.setItem('gadmr_refresh_token', refreshToken);
      
      return registeredUser;
    } catch (error) {
      throw error;
    }
  };

  // Cerrar Sesión (Logout)
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Fallo al revocar refresh token en backend:', error.message);
    } finally {
      setUser(null);
      localStorage.removeItem('gadmr_user');
      localStorage.removeItem('gadmr_access_token');
      localStorage.removeItem('gadmr_refresh_token');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
