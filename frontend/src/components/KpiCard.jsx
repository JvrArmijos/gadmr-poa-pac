// KpiCard.jsx - Tarjetas de visualización de indicadores clave de presupuesto
import React from 'react';

export const KpiCard = ({ title, value, color, desc }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 ${color} hover:shadow-md transition-all duration-300`}>
      <span className="text-xs font-semibold text-slate-400 block">{title}</span>
      <span className="font-title font-bold text-lg md:text-xl text-slate-800 dark:text-white mt-1 block">{value}</span>
      <span className="text-[10px] text-slate-400 mt-2 font-semibold block">{desc}</span>
    </div>
  );
};

export default KpiCard;
