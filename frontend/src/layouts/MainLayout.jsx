// MainLayout.jsx - Layout base para vistas autenticadas (Sidebar + Navbar + Contenedor)
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../services/api.js';

export const MainLayout = () => {
  const navigate = useNavigate();

  // --- Estados Compartidos (Layout Context) ---
  const [projects, setProjects] = useState([]);
  const [directions, setDirections] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [overdueBannerText, setOverdueBannerText] = useState('');
  
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar catálogos e información desde el Backend
  const loadAllData = async () => {
    try {
      const [projRes, dirRes, partRes, roleRes] = await Promise.all([
        api.get('/proyectos'),
        api.get('/common/direcciones'),
        api.get('/common/partidas'),
        api.get('/common/roles')
      ]);

      setProjects(projRes.data);
      setDirections(dirRes.data);
      setPartidas(partRes.data);
      setRoles(roleRes.data);

      // Calcular alertas financieras
      calculateAlerts(projRes.data, dirRes.data);
    } catch (error) {
      console.error('Error cargando información general:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calcular Alertas de Pago Vencidos (Lógica de negocio original)
  const calculateAlerts = (projList, dirList) => {
    const today = new Date('2026-06-30'); // Fecha fija de simulación del GADMR
    let count = 0;
    let totalMora = 0;
    const dirsConVencidos = new Set();

    projList.forEach(p => {
      if (p.pagos) {
        p.pagos.forEach(pay => {
          if (pay.estado !== 'Pagado') {
            const fp = new Date(pay.fecha_prevista);
            if (fp < today) {
              count++;
              totalMora += Number(pay.monto);
              const d = dirList.find(dir => dir.id === p.direccion_id);
              if (d) dirsConVencidos.add(d.sigla);
            }
          }
        });
      }
    });

    setActiveAlertsCount(count);
    if (count > 0) {
      setOverdueBannerText(
        `🚨 ALERTA GADMR: Se detectan ${count} pagos vencidos en ${Array.from(dirsConVencidos).join(', ')} que suman $${totalMora.toLocaleString('en-US')}. El atraso medio es de ${Math.round(totalMora / count > 10000 ? 21 : 12)} días.`
      );
    } else {
      setOverdueBannerText('');
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sincronizar clases de Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Obtener nombre de la vista activa basándose en el pathname actual
  const getViewTitles = () => {
    const path = window.location.pathname;
    switch (path) {
      case '/':
      case '/dashboard':
        return { title: 'Dashboard Global', sub: 'Visualización de indicadores presupuestarios consolidados del GADMR.' };
      case '/projects':
        return { title: 'Proyectos POA / PAC', sub: 'Administración, filtros y control de cadena del gasto de proyectos.' };
      case '/mapa-proyectos':
        return { title: 'Mapa de Proyectos Georreferenciados', sub: 'Visualización de las obras y proyectos del GADMR en la ciudad de Riobamba.' };
      case '/alerts':
        return { title: 'Alertas de Pago', sub: 'Control de mora, desembolsos programados y prioridades críticas.' };
      case '/chat':
        return { title: 'Chatbot Analítico IA', sub: 'Consola de chat con la Inteligencia Artificial del Municipio.' };
      case '/reports':
        return { title: 'Reporte Ejecutivo IA', sub: 'Generación, impresión y exportación de informes inteligentes.' };
      case '/history':
        return { title: 'Historial de Etapas', sub: 'Trazabilidad de fases de transición de proyectos.' };
      case '/logs':
        return { title: 'Logs de Auditoría', sub: 'Bitácora general de operaciones realizadas en el sistema.' };
      default:
        return { title: 'Sistema GADMR', sub: 'Control presupuestario municipal.' };
    }
  };

  const { title, sub } = getViewTitles();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-300 border-t-riobamba-blue"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-riobamba-darkBg transition-colors duration-200">
      
      {/* Sidebar Lateral */}
      <Sidebar activeAlertsCount={activeAlertsCount} />

      {/* Área de Contenido */}
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Navbar Superior */}
        <Navbar 
          title={title}
          subTitle={sub}
          activeAlertsCount={activeAlertsCount}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Banner de Pagos Vencidos */}
        {overdueBannerText && (
          <div className="bg-gradient-to-r from-[#D90429] to-red-650 text-white px-6 py-3 flex items-center justify-between text-xs shadow-inner shrink-0 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="animate-bounce">⚠️</span>
              <span className="font-semibold">{overdueBannerText}</span>
            </div>
            <button 
              onClick={() => navigate('/alerts')} 
              className="px-3 py-1 bg-white text-[#D90429] font-bold text-[10px] rounded-lg hover:bg-slate-100 transition-all shadow-sm shrink-0"
            >
              Ver Alertas
            </button>
          </div>
        )}

        {/* Contenedor Principal Scrollable */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar dark:text-slate-200">
          <Outlet context={{ 
            projects, 
            directions, 
            partidas, 
            roles, 
            loadAllData, 
            darkMode 
          }} />
        </main>

      </div>
    </div>
  );
};

export default MainLayout;
