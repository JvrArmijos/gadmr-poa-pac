// ChartsGrid.jsx - Grid de gráficos interactivos usando react-chartjs-2
import React from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement, 
  LineElement, 
  Filler 
} from 'chart.js';

// Registrar componentes necesarios en ChartJS
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement, 
  LineElement, 
  Filler
);

export const ChartsGrid = ({ projects, directions, darkMode }) => {
  const isDark = darkMode;
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#f1f5f9';

  // --- 1. Gráfico Ejecución por Dirección ---
  const dirExecution = {};
  directions.forEach(d => {
    dirExecution[d.sigla] = { total: 0, devengado: 0 };
  });
  projects.forEach(p => {
    const d = directions.find(dir => dir.id === p.direccion_id);
    if (d) {
      dirExecution[d.sigla].total += p.presupuesto.presupuesto_asignado || 0;
      dirExecution[d.sigla].devengado += p.presupuesto.devengado || 0;
    }
  });

  const labelDir = Object.keys(dirExecution);
  const dataDir = labelDir.map(sig => {
    const de = dirExecution[sig];
    return de.total > 0 ? (de.devengado / de.total) * 100 : 0;
  });

  const executionChartData = {
    labels: labelDir,
    datasets: [{
      label: '% Ejecución',
      data: dataDir,
      backgroundColor: '#134074',
      borderRadius: 8,
      barThickness: 28
    }]
  };

  const executionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor } },
      y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: textColor, callback: (v) => `${v}%` } }
    }
  };

  // --- 2. Dona de Etapas ---
  const stagesCounts = { Preparatoria: 0, Precontractual: 0, Contractual: 0, Ejecución: 0, Cierre: 0 };
  projects.forEach(p => {
    if (stagesCounts[p.etapa] !== undefined) {
      stagesCounts[p.etapa]++;
    }
  });

  const stagesChartData = {
    labels: ['Preparatoria', 'Precontractual', 'Contractual', 'Ejecución', 'Cierre'],
    datasets: [{
      data: [
        stagesCounts.Preparatoria, 
        stagesCounts.Precontractual, 
        stagesCounts.Contractual, 
        stagesCounts.Ejecución, 
        stagesCounts.Cierre
      ],
      backgroundColor: ['#94a3b8', '#134074', '#F5B800', '#10B981', '#8B5CF6'],
      borderWidth: isDark ? 3 : 1,
      borderColor: isDark ? '#1e293b' : '#fff'
    }]
  };

  const stagesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 } } }
    }
  };

  // --- 3. Comparación de Cadena de Gasto (USD) ---
  const dirComparison = {};
  directions.forEach(d => {
    dirComparison[d.sigla] = { asignado: 0, comprometido: 0, devengado: 0, pagado: 0 };
  });
  projects.forEach(p => {
    const d = directions.find(dir => dir.id === p.direccion_id);
    if (d) {
      dirComparison[d.sigla].asignado += p.presupuesto.presupuesto_asignado || 0;
      dirComparison[d.sigla].comprometido += p.presupuesto.comprometido || 0;
      dirComparison[d.sigla].devengado += p.presupuesto.devengado || 0;
      dirComparison[d.sigla].pagado += p.presupuesto.pagado || 0;
    }
  });

  const chainChartData = {
    labels: Object.keys(dirComparison),
    datasets: [
      { label: 'Asignado', data: Object.values(dirComparison).map(d => d.asignado), backgroundColor: '#0B2545' },
      { label: 'Comprometido', data: Object.values(dirComparison).map(d => d.comprometido), backgroundColor: '#F5B800' },
      { label: 'Devengado', data: Object.values(dirComparison).map(d => d.devengado), backgroundColor: '#10B981' },
      { label: 'Pagado', data: Object.values(dirComparison).map(d => d.pagado), backgroundColor: '#8B5CF6' }
    ]
  };

  const chainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: textColor } }
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor } },
      y: { grid: { color: gridColor }, ticks: { color: textColor, callback: (v) => `$${Number(v).toLocaleString()}` } }
    }
  };

  // --- 4. Proyección Temporal de Pagos ---
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const projected = Array(12).fill(0);
  const paid = Array(12).fill(0);

  projects.forEach(p => {
    if (p.pagos) {
      p.pagos.forEach(pay => {
        const datePrev = new Date(pay.fecha_prevista);
        if (datePrev.getFullYear() === 2026) {
          projected[datePrev.getMonth()] += Number(pay.monto);
        }
        if (pay.fecha_real_pago) {
          const dateReal = new Date(pay.fecha_real_pago);
          if (dateReal.getFullYear() === 2026) {
            paid[dateReal.getMonth()] += Number(pay.monto);
          }
        }
      });
    }
  });

  let accProj = 0;
  let accPaid = 0;
  const accProjData = projected.map(v => accProj += v);
  const accPaidData = paid.map(v => accPaid += v);

  const timelineChartData = {
    labels: months,
    datasets: [
      { label: 'Proyectado Acumulado', data: accProjData, borderColor: '#134074', backgroundColor: 'rgba(19, 64, 116, 0.1)', fill: true, tension: 0.3 },
      { label: 'Pagado Acumulado', data: accPaidData, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.3 }
    ]
  };

  const timelineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: textColor } }
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor } },
      y: { grid: { color: gridColor }, ticks: { color: textColor, callback: (v) => `$${Number(v).toLocaleString()}` } }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="font-title font-bold text-xs mb-4 text-slate-700 dark:text-slate-350">Ejecución Presupuestaria por Dirección (%)</h3>
        <div className="h-64">
          <Bar data={executionChartData} options={executionChartOptions} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="font-title font-bold text-xs mb-4 text-slate-700 dark:text-slate-350">Distribución de Proyectos por Etapa</h3>
        <div className="h-64 flex justify-center items-center">
          <Doughnut data={stagesChartData} options={stagesChartOptions} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="font-title font-bold text-xs mb-4 text-slate-700 dark:text-slate-350">Cadena Presupuestaria por Dirección (USD)</h3>
        <div className="h-64">
          <Bar data={chainChartData} options={chainChartOptions} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="font-title font-bold text-xs mb-4 text-slate-700 dark:text-slate-350">Proyección de Pagos POA (Acumulado USD)</h3>
        <div className="h-64">
          <Line data={timelineChartData} options={timelineChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default ChartsGrid;
