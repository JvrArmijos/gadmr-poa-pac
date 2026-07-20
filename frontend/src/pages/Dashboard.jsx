// Dashboard.jsx - Vista Principal del Dashboard Global de POA/PAC
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import KpiCard from '../components/KpiCard.jsx';
import ChartsGrid from '../components/ChartsGrid.jsx';
import { Filter } from 'lucide-react';
import { formatUSD } from '../utils/format.js';

// Fecha fija de simulación
const SIM_DATE = '2026-06-30';

// Función para calcular métricas locales (idéntica a la lógica original de db.js)
const calculateLocalMetrics = (filteredProjects) => {
  const currentDate = new Date(SIM_DATE);
  
  let totalPresupuesto = 0;
  let totalCertificado = 0;
  let totalComprometido = 0;
  let totalDevengado = 0;
  let totalPagado = 0;
  let totalPagosVencidos = 0;
  let sumaDiasAtraso = 0;
  let cantPagosVencidos = 0;

  filteredProjects.forEach(proj => {
    const p = proj.presupuesto;
    totalPresupuesto += Number(p.presupuesto_asignado || 0);
    totalCertificado += Number(p.certificado || 0);
    totalComprometido += Number(p.comprometido || 0);
    totalDevengado += Number(p.devengado || 0);
    totalPagado += Number(p.pagado || 0);

    if (proj.pagos) {
      proj.pagos.forEach(pago => {
        if (pago.estado !== 'Pagado') {
          const fechaPrev = new Date(pago.fecha_prevista);
          if (fechaPrev < currentDate) {
            cantPagosVencidos++;
            totalPagosVencidos += Number(pago.monto);
            const diffTime = Math.abs(currentDate - fechaPrev);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            sumaDiasAtraso += diffDays;
          }
        }
      });
    }
  });

  const pctCertificado = totalPresupuesto > 0 ? (totalCertificado / totalPresupuesto) * 100 : 0;
  const pctComprometido = totalPresupuesto > 0 ? (totalComprometido / totalPresupuesto) * 100 : 0;
  const pctEjecucion = totalPresupuesto > 0 ? (totalDevengado / totalPresupuesto) * 100 : 0;
  const pctPagado = totalDevengado > 0 ? (totalPagado / totalDevengado) * 100 : 0;

  const saldoComprometer = totalPresupuesto - totalComprometido;
  const saldoPagar = totalDevengado - totalPagado;
  const promedioAtraso = cantPagosVencidos > 0 ? Math.round(sumaDiasAtraso / cantPagosVencidos) : 0;

  return {
    totalPresupuesto,
    totalCertificado,
    totalComprometido,
    totalDevengado,
    totalPagado,
    pctCertificado,
    pctComprometido,
    pctEjecucion,
    pctPagado,
    saldoComprometer,
    saldoPagar,
    cantPagosVencidos,
    totalPagosVencidos,
    promedioAtraso
  };
};

export const Dashboard = () => {
  const { projects, directions, darkMode } = useOutletContext();
  const [filterDir, setFilterDir] = useState('');

  // Filtrar proyectos localmente
  const filteredProjects = filterDir === '' 
    ? projects 
    : projects.filter(p => p.direccion_id === Number(filterDir));

  const metrics = calculateLocalMetrics(filteredProjects);

  // Semáforo de etapas
  const stageCounts = { Preparatoria: 0, Precontractual: 0, Contractual: 0, Ejecución: 0, Cierre: 0 };
  filteredProjects.forEach(p => {
    if (stageCounts[p.etapa] !== undefined) {
      stageCounts[p.etapa]++;
    }
  });

  // Lista Prioritaria de Pagos Vencidos (Retraso DESC)
  const overduePaymentsList = [];
  filteredProjects.forEach(p => {
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

  // Rankings de Rendimiento Municipal
  const rankingsMejor = [];
  const rankingsAtraso = [];

  directions.forEach(d => {
    const dirProjs = filteredProjects.filter(p => p.direccion_id === d.id);
    const m = calculateLocalMetrics(dirProjs);
    rankingsMejor.push({ dirName: d.nombre, pct: m.pctEjecucion });
    rankingsAtraso.push({ dirName: d.nombre, vencidos: m.cantPagosVencidos });
  });

  rankingsMejor.sort((a, b) => b.pct - a.pct);
  rankingsAtraso.sort((a, b) => b.vencidos - a.vencidos);

  const kpis = [
    { title: 'Presupuesto Asignado', value: formatUSD(metrics.totalPresupuesto), color: 'border-l-[#0B2545]', desc: 'Presupuesto asignado global' },
    { title: 'Monto Certificado', value: formatUSD(metrics.totalCertificado), color: 'border-l-[#8DA9C4]', desc: `${metrics.pctCertificado.toFixed(1)}% del asignado` },
    { title: 'Monto Comprometido', value: formatUSD(metrics.totalComprometido), color: 'border-l-[#F5B800]', desc: `${metrics.pctComprometido.toFixed(1)}% del asignado` },
    { title: 'Monto Devengado', value: formatUSD(metrics.totalDevengado), color: 'border-l-[#10B981]', desc: `${metrics.pctEjecucion.toFixed(1)}% de ejecución real` },
    { title: 'Monto Pagado', value: formatUSD(metrics.totalPagado), color: 'border-l-[#8B5CF6]', desc: `${metrics.pctPagado.toFixed(1)}% del devengado` },
    { title: 'Saldos Faltantes', value: formatUSD(metrics.saldoPagar), color: 'border-l-slate-400', desc: 'Saldo pendiente de pago' },
    { title: 'Pagos Vencidos', value: metrics.cantPagosVencidos, color: 'border-l-[#D90429] text-[#D90429]', desc: `Mora: ${formatUSD(metrics.totalPagosVencidos)}` },
    { title: 'Promedio Retraso', value: `${metrics.promedioAtraso} días`, color: 'border-l-red-800 text-red-850', desc: 'Atraso promedio de hitos' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Selector de Filtro de Dirección */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#8DA9C4]" />
          <span className="font-title font-bold text-sm text-slate-700 dark:text-slate-350">
            Filtro Rápido de Dirección:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilterDir('')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterDir === '' 
                ? 'bg-[#0B2545] text-white shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Global (Todas)
          </button>
          {directions.map(d => (
            <button 
              key={d.id}
              onClick={() => setFilterDir(String(d.id))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterDir === String(d.id) 
                  ? 'bg-[#0B2545] text-white shadow-sm' 
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {d.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, idx) => (
          <KpiCard 
            key={idx} 
            title={k.title} 
            value={k.value} 
            color={k.color} 
            desc={k.desc} 
          />
        ))}
      </div>

      {/* Grid de Gráficos */}
      <ChartsGrid 
        projects={filteredProjects} 
        directions={directions} 
        darkMode={darkMode} 
      />

      {/* rankings & semaforo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Semáforo */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 lg:col-span-1 space-y-3.5">
          <h3 className="font-title font-bold text-sm text-slate-805 dark:text-white">Semáforo de Etapas</h3>
          {[
            { et: 'Preparatoria', color: 'bg-slate-400', count: stageCounts.Preparatoria },
            { et: 'Precontractual', color: 'bg-[#134074]', count: stageCounts.Precontractual },
            { et: 'Contractual', color: 'bg-[#F5B800]', count: stageCounts.Contractual },
            { et: 'Ejecución', color: 'bg-[#10B981]', count: stageCounts.Ejecución },
            { et: 'Cierre', color: 'bg-[#8B5CF6]', count: stageCounts.Cierre }
          ].map((s, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className={`h-4.5 w-4.5 rounded-full ${s.color} shrink-0`}></span>
                <span className="text-xs font-semibold">{s.et}</span>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-lg">{s.count}</span>
            </div>
          ))}
        </div>

        {/* Rankings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 lg:col-span-2 space-y-4">
          <h3 className="font-title font-bold text-sm text-slate-805 dark:text-white">Rankings de Rendimiento Municipal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-xs font-bold text-[#10B981] uppercase tracking-wide block mb-3">Mejor Ejecución Presupuestaria</span>
              <ul className="space-y-2 text-xs">
                {rankingsMejor.map((item, idx) => (
                  <li key={idx} className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-805/30 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold truncate max-w-[150px]">{idx + 1}. {item.dirName}</span>
                    <span className="font-bold text-[#10B981]">{item.pct.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-xs font-bold text-[#D90429] uppercase tracking-wide block mb-3">Direcciones con más Atrasos</span>
              <ul className="space-y-2 text-xs">
                {rankingsAtraso.map((item, idx) => (
                  <li key={idx} className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-805/30 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold truncate max-w-[150px]">{idx + 1}. {item.dirName}</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${item.vencidos > 0 ? 'bg-red-100 text-[#D90429]' : 'bg-slate-150 text-slate-500'}`}>
                      {item.vencidos} vencidos
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Tabla Prioritaria de Pagos Vencidos */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="font-title font-bold text-sm text-slate-805 dark:text-white mb-4">Lista Prioritaria de Pagos Vencidos (Retraso DESC)</h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
            <thead className="text-[10px] text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5">Código</th>
                <th className="px-4 py-2.5">Proyecto / Objeto</th>
                <th className="px-4 py-2.5">Hito Vencido</th>
                <th className="px-4 py-2.5 text-right">Monto</th>
                <th className="px-4 py-2.5 text-center">Días Atraso</th>
                <th className="px-4 py-2.5 text-center">Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {overduePaymentsList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-400 font-semibold">
                    Sin pagos vencidos registrados.
                  </td>
                </tr>
              ) : (
                overduePaymentsList.map((item, idx) => {
                  const priority = item.dias >= 28 ? 'critica' : item.dias >= 15 ? 'alta' : 'media';
                  return (
                    <tr key={idx} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">
                        {item.proj.codigo_proceso}
                      </td>
                      <td className="px-4 py-3 truncate max-w-[200px]" title={item.proj.nombre}>
                        {item.proj.nombre}
                      </td>
                      <td className="px-4 py-3 text-slate-450">{item.pay.descripcion}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatUSD(item.pay.monto)}</td>
                      <td className="px-4 py-3 text-center font-bold text-[#D90429]">{item.dias} d</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                          priority === 'critica' 
                            ? 'bg-red-100 text-[#D90429]' 
                            : priority === 'alta' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-blue-100 text-[#134074]'
                        }`}>
                          {priority === 'critica' ? 'Crítica' : priority === 'alta' ? 'Alta' : 'Media'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
