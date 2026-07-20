// PaymentModal.jsx - Modal para procesar el pago de un hito
import React, { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { formatUSD } from '../utils/format.js';

export const PaymentModal = ({ isOpen, onClose, onConfirm, description, monto }) => {
  const [payDateReal, setPayDateReal] = useState('2026-06-30');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!payDateReal) {
      alert('Debe ingresar la fecha de pago.');
      return;
    }
    onConfirm(payDateReal);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Cabecera */}
        <div className="bg-[#0B2545] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-title font-bold text-sm">Registrar Pago Financiero</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Hito a Liquidar:</span>
              <span className="font-bold text-slate-850 dark:text-white">{description}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor a Transferir:</span>
              <span className="font-bold text-base text-[#10B981]">{formatUSD(monto)}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Fecha de Pago Efectivo: *</label>
            <input 
              type="date" 
              required 
              value={payDateReal} 
              onChange={(e) => setPayDateReal(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none"
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Wallet className="h-4 w-4" /> Desembolsar
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default PaymentModal;
