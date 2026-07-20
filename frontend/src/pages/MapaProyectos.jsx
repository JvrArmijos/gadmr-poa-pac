// MapaProyectos.jsx - Vista de Mapa General de Proyectos Georreferenciados
import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import ProjectMapView from '../components/mapa/ProjectMapView.jsx';

export const MapaProyectos = () => {
  const [projectsMap, setProjectsMap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMapProjects = async () => {
    try {
      const response = await api.get('/proyectos/mapa');
      setProjectsMap(response.data);
    } catch (err) {
      setError(err.message || 'Error al cargar los proyectos en el mapa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapProjects();
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-220px)] w-full flex items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-300 border-t-riobamba-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 text-[#D90429] text-xs font-bold rounded-2xl text-center border border-[#D90429]">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contenedor del Mapa */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="font-title font-bold text-sm mb-1.5 text-slate-800 dark:text-white">
          Ubicación Territorial de Obras GADMR
        </h3>
        <p className="text-xs text-slate-400 font-medium mb-4">
          Visualización de todas las obras georreferenciadas. Haga clic sobre cualquier marcador para desplegar los detalles de estado, inversión y plazo.
        </p>
        <ProjectMapView projects={projectsMap} />
      </div>
    </div>
  );
};

export default MapaProyectos;
