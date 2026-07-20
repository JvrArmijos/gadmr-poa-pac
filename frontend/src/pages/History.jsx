// History.jsx - Visualización del historial de cambios de etapa de proyectos
import React, { useState, useEffect } from 'react';
import api from '../services/api.js';

export const History = () => {
  const [historialEtapas, setHistorialEtapas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/common/historial-etapas');
      setHistorialEtapas(response.data);
    } catch (error) {
      console.error('Error cargando historial de etapas:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-riobamba-blue"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
      <h3 className="font-title font-bold text-sm text-slate-800 dark:text-white mb-4">
        Historial de Cambios de Etapa de Proyectos
      </h3>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
          <thead className="text-[10px] text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Proyecto</th>
              <th className="px-6 py-4 text-center">Etapa Anterior</th>
              <th className="px-6 py-4 text-center">Etapa Nueva</th>
              <th className="px-6 py-4">Fecha Cambio</th>
              <th className="px-6 py-4">Cambiado Por</th>
            </tr>
          </thead>
          <tbody>
            {historialEtapas.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-slate-400">
                  Sin historial registrado en el sistema.
                </td>
              </tr>
            ) : (
              historialEtapas.map(h => (
                <tr key={h.id} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3 font-semibold">{h.id}</td>
                  <td className="px-6 py-3 font-medium truncate max-w-xs">{h.proyecto_nombre || 'Proyecto Eliminado'}</td>
                  <td className="px-6 py-3 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-semibold">
                      {h.etapa_anterior}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-[#10B981] dark:bg-emerald-950/20 rounded font-bold">
                      {h.etapa_nueva}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400">{h.fecha_cambio}</td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-350">{h.usuario_nombre || 'Sistema'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
