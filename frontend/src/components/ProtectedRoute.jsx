// ProtectedRoute.jsx - Wrapper para bloquear rutas según sesión y roles
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-350 border-t-riobamba-blue"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a login si no hay sesión
    return <Navigate to="/login" replace />;
  }

  // Verificar si requiere validación de roles
  if (allowedRoles.length > 0) {
    const { role_id, role_nombre } = user;
    
    const isAllowed = allowedRoles.some(role => {
      if (typeof role === 'number') {
        return role_id === role;
      }
      if (typeof role === 'string') {
        const normRole = role.toLowerCase();
        return role_nombre.toLowerCase().includes(normRole);
      }
      return false;
    });

    if (!isAllowed) {
      // Si el rol no coincide, redirigir al Dashboard principal
      return <Navigate to="/" replace />;
    }
  }

  // Si está autenticado y tiene rol permitido, renderizar contenido
  return <Outlet />;
};

export default ProtectedRoute;
