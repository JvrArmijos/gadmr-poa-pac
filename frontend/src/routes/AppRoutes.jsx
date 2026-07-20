// AppRoutes.jsx - Definición del árbol de rutas de la aplicación
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout.jsx';

// Componente de protección
import ProtectedRoute from '../components/ProtectedRoute.jsx';

// Páginas Públicas
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';

// Páginas Privadas
import Dashboard from '../pages/Dashboard.jsx';
import Projects from '../pages/Projects.jsx';
import MapaProyectos from '../pages/MapaProyectos.jsx';
import Alerts from '../pages/Alerts.jsx';
import Chatbot from '../pages/Chatbot.jsx';
import Reports from '../pages/Reports.jsx';
import History from '../pages/History.jsx';
import Logs from '../pages/Logs.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rutas Privadas Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          
          {/* Dashboard y Módulos comunes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          
          <Route path="/projects" element={<Projects />} />
          <Route path="/mapa-proyectos" element={<MapaProyectos />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/chat" element={<Chatbot />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/history" element={<History />} />

          {/* Módulo Especial Protegido adicionalmente por Roles */}
          <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Dirección Financiera']} />}>
            <Route path="/logs" element={<Logs />} />
          </Route>

        </Route>
      </Route>

      {/* Redirección por defecto para rutas inexistentes */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
};

export default AppRoutes;
