// ProjectDetailModal.jsx - Modal para ver el detalle completo de un proyecto
import React from 'react';
import { X, Wallet } from 'lucide-react';
import { formatUSD } from '../utils/format.js';

export const ProjectDetailModal = ({ 
  isOpen, 
  onClose, 
  project, 
  directions, 
  partidas, 
  user,
  onOpenPayment 
}) => {
  if (!isOpen || !project) return null;

  const dir = directions.find(d => d.id === project.direccion_id);
  const userRole = user?.role_nombre?.toLowerCase() || '';
  
  // Roles autorizados a registrar pagos
  const canPay = userRole.includes('finan') || userRole.includes('admin');

  // Calcular porcentaje de ejecución devengado / asignado
  const devengado = project.presupuesto.devengado || 0;
  const asignado = project.presupuesto.presupuesto_asignado || 1;
  const execPct = (devengado / asignado) * 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Cabecera del Modal */}
        <div className="bg-[#0B2545] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold bg-[#D90429] text-white px-2.5 py-1 rounded-md">
              {project.codigo_proceso}
            </span>
            <h2 className="font-title font-bold text-base text-white mt-2">{project.nombre}</h2>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-2">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          
          {/* Ficha Resumen de Responsables */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Dirección Responsable:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {dir ? dir.nombre : 'N/D'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Vinculación POA:</span>
              <span className="font-semibold text-slate-750 dark:text-slate-300">{project.vinculacion_poa}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Vinculación PAC:</span>
              <span className="font-semibold text-slate-750 dark:text-slate-300">{project.vinculacion_pac}</span>
            </div>
          </div>

          {/* Información Contractual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Contratista / Adjudicado:</span>
              <span className="font-semibold">{project.proveedor_contratista || 'Por adjudicar'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Forma de Pago:</span>
              <span className="font-semibold">{project.forma_pago}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Duración Contractual:</span>
              <span className="font-semibold">{project.duracion_dias} días</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Vigencia del Plazo:</span>
              <span className="font-semibold">{project.fecha_inicio} a {project.fecha_fin}</span>
            </div>
          </div>

          {/* Partidas POA Vinculadas */}
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">Partidas POA Vinculadas</span>
            <ul className="space-y-1">
              {project.partidas?.map((part, idx) => {
                const catalog = partidas.find(c => c.codigo === part.codigo);
                return (
                  <li key={idx} className="bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-lg flex justify-between font-medium">
                    <span className="font-mono text-slate-500">{part.codigo}</span>
                    <span className="truncate max-w-[280px] text-slate-400 font-normal">{catalog?.denominacion || 'N/D'}</span>
                    <span className="font-bold">{formatUSD(part.monto_asignado)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Progreso Físico-Financiero */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>Ejecución Presupuestaria (Devengado / Asignado):</span>
              <span className="font-bold text-[#10B981]">
                {execPct.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#10B981] h-full" 
                style={{ width: `${Math.min(execPct, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Cadena del Gasto en Tarjetas */}
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">Cadena del Gasto Presupuestario</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Certificado', val: project.presupuesto.certificado, date: project.presupuesto.fecha_certificacion },
                { name: 'Comprometido', val: project.presupuesto.comprometido, date: project.presupuesto.fecha_compromiso },
                { name: 'Devengado', val: project.presupuesto.devengado, date: project.presupuesto.fecha_devengado },
                { name: 'Pagado', val: project.presupuesto.pagado, date: project.presupuesto.fecha_pago }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] text-slate-450 font-bold block uppercase">{idx + 1}. {item.name}</span>
                  <span className="font-bold text-sm block">{formatUSD(item.val)}</span>
                  <span className="text-[8px] text-slate-400 block mt-1">{item.date ? `F: ${item.date}` : 'Sin fecha'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hitos de Pago */}
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">Cronograma de Pagos / Hitos Programados</span>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-[11px] text-left text-slate-500 dark:text-slate-450">
                <thead className="text-[9px] text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Descripción</th>
                    <th className="px-4 py-2 text-right">Monto</th>
                    <th className="px-4 py-2 text-center">Fecha Programada</th>
                    <th className="px-4 py-2 text-center">Fecha Real Pago</th>
                    <th className="px-4 py-2 text-center">Estado</th>
                    <th className="px-4 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {project.pagos?.map((pay, idx) => {
                    const isOverdue = pay.estado !== 'Pagado' && new Date(pay.fecha_prevista) < new Date('2026-06-30');
                    return (
                      <tr key={idx} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-white">{pay.descripcion}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-750 dark:text-slate-200">{formatUSD(pay.monto)}</td>
                        <td className="px-4 py-2.5 text-center text-slate-400">{pay.fecha_prevista}</td>
                        <td className="px-4 py-2.5 text-center">{pay.fecha_real_pago || '-'}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                            pay.estado === 'Pagado' 
                              ? 'bg-emerald-100 text-[#10B981]' 
                              : isOverdue 
                                ? 'bg-red-100 text-[#D90429] animate-pulse' 
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {pay.estado === 'Pagado' ? 'Pagado' : isOverdue ? 'Vencido' : 'Programado'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {canPay && pay.estado !== 'Pagado' ? (
                            <button 
                              onClick={() => onOpenPayment(pay)}
                              className="px-2 py-1 bg-[#10B981] hover:bg-emerald-600 text-white rounded text-[10px] font-bold shadow-sm transition-all flex items-center gap-1 inline-flex"
                            >
                              <Wallet className="h-3 w-3" /> Pagar
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 flex justify-end gap-2 border-t">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-semibold text-xs rounded-xl"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProjectDetailModal;
