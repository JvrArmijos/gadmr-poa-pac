// Logs.jsx - Visualización de la bitácora de auditoría general (Audit Logs)
import React, { useState, useEffect } from 'react';
import api from '../services/api.js';

export const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/common/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Error cargando audit logs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
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
        Registro de Auditoría (Audit Logs)
      </h3>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
          <thead className="text-[10px] text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">ID Log</th>
              <th className="px-6 py-4">Fecha y Hora</th>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Acción</th>
              <th className="px-6 py-4">Módulo</th>
              <th className="px-6 py-4">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-slate-400">
                  Sin registros de auditoría en el sistema.
                </td>
              </tr>
            ) : (
              logs.map(l => (
                <tr key={l.id} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                  <td className="px-6 py-3 font-semibold">{l.id}</td>
                  <td className="px-6 py-3 text-slate-400">{l.fecha}</td>
                  <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">
                    {l.usuario_nombre || 'Sistema'}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded">
                      {l.accion}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono">{l.tabla_afectada}</td>
                  <td className="px-6 py-3 text-slate-400 max-w-xs truncate" title={l.detalles}>
                    {l.detalles}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;
