// Navbar.jsx - Barra de cabecera superior para el panel de administración
import React from 'react';
import { Moon, Sun, Bell, LogOut } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';

export const Navbar = ({ title, subTitle, activeAlertsCount, darkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 shrink-0">
      
      {/* Título de la Sección Activa */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-title font-bold text-xl md:text-2xl text-slate-800 dark:text-white capitalize">
            {title}
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden md:block">
            {subTitle || 'Consola de Control del Presupuesto y Pago del GADMR.'}
          </p>
        </div>
      </div>

      {/* Perfil, Notificaciones y Configuración */}
      <div className="flex items-center gap-4">
        
        {/* Visualización del Rol del Usuario */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Rol Activo:</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-white">
            {user?.role_nombre || 'Usuario'}
          </span>
        </div>

        {/* Notificaciones de Mora */}
        <div className="relative">
          <button 
            className="p-2 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-all"
            title="Alertas de Pago"
          >
            <Bell className="h-5.5 w-5.5" />
            {activeAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-600 rounded-full animate-ping"></span>
            )}
          </button>
        </div>

        {/* Botón Dark Mode */}
        <button 
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {darkMode ? <Sun className="h-5.5 w-5.5" /> : <Moon className="h-5.5 w-5.5" />}
        </button>

        {/* Cierre de Sesión */}
        <button 
          onClick={logout}
          className="p-2 text-slate-500 hover:text-red-650 dark:text-slate-400 dark:hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border border-transparent hover:border-red-200"
          title="Cerrar Sesión"
        >
          <LogOut className="h-5.5 w-5.5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
