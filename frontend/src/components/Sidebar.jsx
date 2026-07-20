// Sidebar.jsx - Menú de navegación lateral izquierdo
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Briefcase, Map, BellRing, MessageSquare, 
  FileText, History, FileClock 
} from 'lucide-react';
import useAuth from '../hooks/useAuth.js';

export const Sidebar = ({ activeAlertsCount }) => {
  const { user } = useAuth();
  
  // Roles autorizados a visualizar bitácoras de auditoría
  const showLogs = user?.role_id === 4 || 
                   user?.role_id === 3 || 
                   user?.role_nombre?.toLowerCase().includes('admin') || 
                   user?.role_nombre?.toLowerCase().includes('finan');

  const navItems = [
    { to: '/', label: 'Dashboard Global', icon: LayoutDashboard },
    { to: '/projects', label: 'Proyectos POA / PAC', icon: Briefcase },
    { to: '/mapa-proyectos', label: 'Mapa de Proyectos', icon: Map },
    { to: '/alerts', label: 'Alertas de Pago', icon: BellRing, badge: activeAlertsCount },
    { to: '/chat', label: 'Chatbot IA Analítico', icon: MessageSquare },
    { to: '/reports', label: 'Reportes Ejecutivos IA', icon: FileText },
    { to: '/history', label: 'Historial de Etapas', icon: History }
  ];

  if (showLogs) {
    navItems.push({ to: '/logs', label: 'Logs de Auditoría', icon: FileClock });
  }

  return (
    <aside className="hidden md:flex flex-col w-72 bg-[#0B2545] text-white shrink-0 border-r border-slate-800 dark:bg-slate-900 transition-all duration-300">
      
      {/* Logotipo del GAD Municipal de Riobamba */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="h-10 w-10 rounded-lg overflow-hidden shadow-md border border-yellow-400 bg-white flex items-center justify-center">
          <img
            src="https://registrodelapropiedadriobamba.gob.ec/assets/img/logo-cuadrado-f.webp"
            alt="Logo GAD Riobamba"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h2 className="font-title font-bold text-sm tracking-wide text-white">GAD MUNICIPAL</h2>
          <span className="text-[10px] font-semibold text-[#8DA9C4] tracking-wider uppercase">RIOBAMBA - POA/PAC</span>
        </div>
      </div>

      {/* Navegación de rutas */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center justify-between w-full gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#134074] text-white shadow-sm font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3.5">
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-[#D90429] text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer del Sidebar / Tarjeta de Usuario */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-[#8DA9C4] rounded-full flex items-center justify-center font-bold text-[#0B2545] uppercase shadow-inner">
            {user?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-white truncate">
              {user?.nombre || 'Usuario'}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {user?.role_nombre || 'Rol'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
