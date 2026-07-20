// Alerts.jsx - Bandeja de Control de Alertas de Pago en Mora
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';
import { AlertTriangle, Wallet } from 'lucide-react';
import { formatUSD } from '../utils/format.js';
import PaymentModal from '../components/PaymentModal.jsx';

const SIM_DATE = '2026-06-30';

export const Alerts = () => {
  const { user } = useAuth();
  const { projects, directions, loadAllData } = useOutletContext();
  const userRole = user?.role_nombre?.toLowerCase() || '';

  // Modal Pago
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [targetPayment, setTargetPayment] = useState(null);
  const [targetProjectId, setTargetProjectId] = useState(null);

  const canPay = userRole.includes('finan') || userRole.includes('admin');

  // Calcular lista detallada de moras
  const overduePaymentsList = [];
  projects.forEach(p => {
    if (p.pagos) {
      p.pagos.forEach(pay => {
        if (pay.estado !== 'Pagado') {
          const fp = new Date(pay.fecha_prevista);
          if (fp < new Date(SIM_DATE)) {
            const diffDays = Math.ceil(Math.abs(new Date(SIM_DATE).getTime() - fp.getTime()) / (1000 * 60 * 60 * 24));
            overduePaymentsList.push({ proj: p, pay, dias: diffDays });
          }
        }
      });
    }
  });
  overduePaymentsList.sort((a, b) => b.dias - a.dias);

  // Totales por prioridad
  const totalMora = overduePaymentsList.reduce((sum, item) => sum + item.pay.monto, 0);
  const countCriticas = overduePaymentsList.filter(item => item.dias >= 28).length;
  const countAltas = overduePaymentsList.filter(item => item.dias >= 15 && item.dias < 28).length;
  const countMedias = overduePaymentsList.filter(item => item.dias < 15).length;

  const handleOpenPayment = (projId, payment) => {
    setTargetPayment(payment);
    setTargetProjectId(projId);
    setIsPaymentOpen(true);
  };

  const handleConfirmPayment = async (fechaRealPago) => {
    try {
      await api.post(`/proyectos/${targetProjectId}/pagos/${targetPayment.id}/registrar`, {
        fecha_real_pago: fechaRealPago
      });
      alert('Pago registrado y presupuesto de obra recalculado.');
      
      setIsPaymentOpen(false);
      setTargetPayment(null);
      setTargetProjectId(null);
      
      await loadAllData();
    } catch (error) {
      alert(error.message || 'Error al procesar el pago.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cards Indicadores de Mora */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-[#D90429]">
          <span className="text-xs font-semibold text-slate-400 block">Total en Mora</span>
          <span className="font-title font-bold text-lg text-slate-850 dark:text-white mt-1 block">
            {formatUSD(totalMora)}
          </span>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Deuda total vencida consolidada</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-red-650">
          <span className="text-xs font-semibold text-slate-400 block">Alertas Críticas</span>
          <span className="font-title font-bold text-lg text-[#D90429] mt-1 block">
            {countCriticas}
          </span>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Retraso mayor o igual a 28 días</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-[#F5B800]">
          <span className="text-xs font-semibold text-slate-400 block">Alertas Altas</span>
          <span className="font-title font-bold text-lg text-[#F5B800] mt-1 block">
            {countAltas}
          </span>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Retraso entre 15 y 27 días</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-[#134074]">
          <span className="text-xs font-semibold text-slate-400 block">Alertas Medias</span>
          <span className="font-title font-bold text-lg text-[#134074] mt-1 block">
            {countMedias}
          </span>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Retraso menor a 15 días</p>
        </div>
      </div>

      {/* Listado Detallado */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-title font-bold text-sm mb-4">Panel Detallado de Alertas del GADMR</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {overduePaymentsList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850">
              No se registran alertas financieras en el sistema.
            </div>
          ) : (
            overduePaymentsList.map((item, idx) => {
              const priority = item.dias >= 28 ? 'critica' : item.dias >= 15 ? 'alta' : 'media';
              const d = directions.find(dir => dir.id === item.proj.direccion_id);
              
              return (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${
                    priority === 'critica' 
                      ? 'border-l-[#D90429]' 
                      : priority === 'alta' 
                        ? 'border-l-[#F5B800]' 
                        : 'border-l-[#8DA9C4]'
                  } flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-all`}
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-bold rounded text-slate-550">
                        {item.proj.codigo_proceso}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        priority === 'critica' 
                          ? 'bg-red-100 text-[#D90429]' 
                          : priority === 'alta' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-blue-100 text-[#134074]'
                      }`}>
                        {priority === 'critica' ? 'Crítica (>=28 días)' : priority === 'alta' ? 'Alta (15-27 días)' : 'Media (<15 días)'}
                      </span>
                      <span className="text-[#D90429] font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 inline" /> {item.dias} días de atraso
                      </span>
                    </div>
                    <h4 className="font-title font-bold text-xs mt-1.5 text-slate-800 dark:text-white">
                      {item.proj.nombre}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Hito: *{item.pay.descripcion}* | Responsable: *{d ? d.nombre : 'N/D'}*
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">Valor Pendiente</span>
                      <span className="font-bold text-sm">{formatUSD(item.pay.monto)}</span>
                    </div>
                    {canPay && (
                      <button 
                        onClick={() => handleOpenPayment(item.proj.id, item.pay)}
                        className="px-3.5 py-1.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Wallet className="h-3.5 w-3.5" /> Procesar Pago
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Confirmar Pago */}
      {isPaymentOpen && targetPayment && (
        <PaymentModal 
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setTargetPayment(null);
            setTargetProjectId(null);
          }}
          onConfirm={handleConfirmPayment}
          description={targetPayment.descripcion}
          monto={targetPayment.monto}
        />
      )}

    </div>
  );
};

export default Alerts;
