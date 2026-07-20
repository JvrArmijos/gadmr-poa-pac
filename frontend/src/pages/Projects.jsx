// Projects.jsx - Módulo de Proyectos POA/PAC con CRUD y filtros
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';
import { Eye, Edit3, Trash2, Plus, Search } from 'lucide-react';
import { formatUSD } from '../utils/format.js';

// Modales
import ProjectModal from '../components/ProjectModal.jsx';
import ProjectDetailModal from '../components/ProjectDetailModal.jsx';
import PaymentModal from '../components/PaymentModal.jsx';

export const Projects = () => {
  const { user } = useAuth();
  const { projects, directions, partidas, loadAllData } = useOutletContext();

  const userRole = user?.role_nombre?.toLowerCase() || '';
  const isAlcalde = userRole.includes('alcald');
  const isAdmin = userRole.includes('admin');

  // --- Estados de Filtros ---
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');

  // --- Estados de Modales ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [targetPayment, setTargetPayment] = useState(null);
  const [targetProjectId, setTargetProjectId] = useState(null);

  // Filtrado de proyectos en el frontend
  const filteredProjectsList = projects.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(filterSearch.toLowerCase()) || 
                          p.codigo_proceso.toLowerCase().includes(filterSearch.toLowerCase());
    
    let matchesDirection = true;
    if (userRole.includes('director') && user) {
      matchesDirection = p.direccion_id === user.direccion_id;
    } else {
      matchesDirection = filterDirection === '' ? true : p.direccion_id === Number(filterDirection);
    }

    const matchesStage = filterStage === '' ? true : p.etapa === filterStage;

    let matchesPayment = true;
    if (filterPaymentStatus !== '') {
      let hasOverdue = false;
      if (p.pagos) {
        hasOverdue = p.pagos.some(pay => pay.estado !== 'Pagado' && new Date(pay.fecha_prevista) < new Date('2026-06-30'));
      }
      matchesPayment = filterPaymentStatus === 'Vencido' ? hasOverdue : !hasOverdue;
    }

    return matchesSearch && matchesDirection && matchesStage && matchesPayment;
  });

  // --- Acciones de CRUD ---
  
  // Guardar proyecto (Nuevo o Editado)
  const handleSaveProject = async (payload) => {
    try {
      if (editingProject) {
        await api.put(`/proyectos/${editingProject.id}`, payload);
        alert('Proyecto actualizado exitosamente.');
      } else {
        await api.post('/proyectos', payload);
        alert('Proyecto creado exitosamente.');
      }
      setIsFormOpen(false);
      setEditingProject(null);
      await loadAllData();
    } catch (error) {
      alert(error.message || 'Error al guardar el proyecto.');
    }
  };

  // Eliminar proyecto
  const handleDeleteProject = async (id, name) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden eliminar proyectos.');
      return;
    }
    if (window.confirm(`¿Desea eliminar definitivamente el proyecto "${name}"?`)) {
      try {
        await api.delete(`/proyectos/${id}`);
        alert('Proyecto eliminado exitosamente.');
        await loadAllData();
      } catch (error) {
        alert(error.message || 'Error al eliminar el proyecto.');
      }
    }
  };

  // Procesar desembolso de pago
  const handleConfirmPayment = async (fechaRealPago) => {
    try {
      await api.post(`/proyectos/${targetProjectId}/pagos/${targetPayment.id}/registrar`, {
        fecha_real_pago: fechaRealPago
      });
      alert('Pago registrado y presupuesto de obra recalculado.');
      
      setIsPaymentOpen(false);
      setIsDetailOpen(false);
      setTargetPayment(null);
      setTargetProjectId(null);
      
      await loadAllData();
    } catch (error) {
      alert(error.message || 'Error al procesar el pago.');
    }
  };

  // Abrir modal de pago desde el detalle
  const handleOpenPayment = (payment) => {
    setTargetPayment(payment);
    setTargetProjectId(selectedProject.id);
    setIsPaymentOpen(true);
  };

  const badgeColors = {
    Preparatoria: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350',
    Precontractual: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Contractual: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-450',
    Ejecución: 'bg-emerald-100 text-emerald-805 dark:bg-emerald-900/30 dark:text-emerald-400',
    Cierre: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  };

  return (
    <div className="space-y-6">
      
      {/* Contenedor Filtros */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h3 className="font-title font-bold text-sm">Filtros de Búsqueda</h3>
          {!isAlcalde && (
            <button 
              onClick={() => {
                setEditingProject(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-[#134074] hover:bg-[#0B2545] text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Registrar Proyecto
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Buscar Proyecto / Código:</label>
            <input 
              type="text" 
              value={filterSearch} 
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Escribe el nombre o proceso..."
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Dirección de Gestión:</label>
            <select 
              value={filterDirection} 
              onChange={(e) => setFilterDirection(e.target.value)}
              disabled={userRole.includes('director')}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="">Todas las Direcciones</option>
              {directions.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Etapa actual:</label>
            <select 
              value={filterStage} 
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="">Todas las Etapas</option>
              <option value="Preparatoria">Preparatoria</option>
              <option value="Precontractual">Precontractual</option>
              <option value="Contractual">Contractual</option>
              <option value="Ejecución">Ejecución</option>
              <option value="Cierre">Cierre</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Alertas de Pagos:</label>
            <select 
              value={filterPaymentStatus} 
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="">Todos los Estados</option>
              <option value="Correcto">Sin pagos vencidos</option>
              <option value="Vencido">Con pagos vencidos</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={() => { setFilterSearch(''); setFilterDirection(''); setFilterStage(''); setFilterPaymentStatus(''); }}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-300 font-semibold text-xs rounded-lg transition-all"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
            <thead className="text-[10px] text-slate-750 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Código Proceso</th>
                <th className="px-6 py-4">Nombre del Proyecto</th>
                <th className="px-6 py-4">Dirección</th>
                <th className="px-6 py-4 text-center">Etapa Actual</th>
                <th className="px-6 py-4 text-center">Ejecución</th>
                <th className="px-6 py-4 text-center">Pagos Vencidos</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjectsList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400 font-semibold">
                    No se encontraron proyectos con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProjectsList.map((p) => {
                  const devengado = p.presupuesto.devengado || 0;
                  const asignado = p.presupuesto.presupuesto_asignado || 1;
                  const execPct = (devengado / asignado) * 100;
                  
                  const vencidosCount = p.pagos 
                    ? p.pagos.filter(pay => pay.estado !== 'Pagado' && new Date(pay.fecha_prevista) < new Date('2026-06-30')).length 
                    : 0;

                  return (
                    <tr key={p.id} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                        {p.codigo_proceso}
                      </td>
                      <td className="px-6 py-4 truncate max-w-[240px]" title={p.nombre}>
                        {p.nombre}
                      </td>
                      <td className="px-6 py-4 font-medium">{p.direccion_sigla}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${badgeColors[p.etapa] || 'bg-slate-100'}`}>
                          {p.etapa}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#10B981] h-full" style={{ width: `${Math.min(execPct, 100)}%` }}></div>
                          </div>
                          <span className="font-bold">{execPct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {vencidosCount > 0 ? (
                          <span className="px-2 py-0.5 bg-red-100 text-[#D90429] font-bold rounded">
                            {vencidosCount} vencido
                          </span>
                        ) : (
                          <span className="text-slate-400">Ninguno</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => {
                              setSelectedProject(p);
                              setIsDetailOpen(true);
                            }} 
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700" 
                            title="Ver Detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!isAlcalde && (
                            <button 
                              onClick={() => {
                                setEditingProject(p);
                                setIsFormOpen(true);
                              }} 
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700" 
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button 
                              onClick={() => handleDeleteProject(p.id, p.nombre)} 
                              className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-[#D90429] rounded-lg" 
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORMULARIO */}
      <ProjectModal 
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        editingProject={editingProject}
        directions={directions}
        partidas={partidas}
        user={user}
      />

      {/* MODAL DETALLE */}
      <ProjectDetailModal 
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        directions={directions}
        partidas={partidas}
        user={user}
        onOpenPayment={handleOpenPayment}
      />

      {/* MODAL PROCESAR PAGO */}
      {isPaymentOpen && targetPayment && (
        <PaymentModal 
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setTargetPayment(null);
          }}
          onConfirm={handleConfirmPayment}
          description={targetPayment.descripcion}
          monto={targetPayment.monto}
        />
      )}

    </div>
  );
};

export default Projects;
