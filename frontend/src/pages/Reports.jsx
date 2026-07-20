// Reports.jsx - Página de generación de Reportes Ejecutivos e informes IA
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sparkles, Download, Printer } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';

export const Reports = () => {
  const { projects } = useOutletContext();
  const { user } = useAuth();
  
  const [aiReportHtml, setAiReportHtml] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados del Formulario
  const [periodType, setPeriodType] = useState('anual');
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('3'); // Marzo por defecto
  const [semester, setSemester] = useState('1');

  // Metadatos para el Encabezado
  const [reportMetadata, setReportMetadata] = useState({
    generationDate: '',
    periodText: '',
    author: '',
    role: ''
  });

  const getFormattedNow = () => {
    const now = new Date();
    const formatDigit = (n) => (n < 10 ? '0' + n : n);
    return `${formatDigit(now.getDate())}/${formatDigit(now.getMonth() + 1)}/${now.getFullYear()} ${formatDigit(now.getHours())}:${formatDigit(now.getMinutes())}:${formatDigit(now.getSeconds())}`;
  };

  const formatDbDate = (dbDateStr) => {
    if (!dbDateStr) return '';
    const dateObj = new Date(dbDateStr);
    if (isNaN(dateObj.getTime())) return dbDateStr;
    const formatDigit = (n) => (n < 10 ? '0' + n : n);
    return `${formatDigit(dateObj.getDate())}/${formatDigit(dateObj.getMonth() + 1)}/${dateObj.getFullYear()} ${formatDigit(dateObj.getHours())}:${formatDigit(dateObj.getMinutes())}:${formatDigit(dateObj.getSeconds())}`;
  };

  // Cargar reporte guardado al montar la vista
  useEffect(() => {
    const fetchSavedReports = async () => {
      try {
        const response = await api.get('/ai/reportes');
        if (response.data.length > 0) {
          const rep = response.data[0];
          setAiReportHtml(rep.analisis_texto);
          
          let pText = 'Global';
          try {
            const meta = JSON.parse(rep.metadata);
            if (meta && meta.periodText) {
              pText = meta.periodText;
            } else if (rep.tipo_reporte) {
              pText = rep.tipo_reporte.toUpperCase();
            }
          } catch(e) {}

          setReportMetadata({
            generationDate: formatDbDate(rep.fecha_generacion),
            periodText: pText,
            author: rep.usuario_nombre || 'Antigravity AI Engine',
            role: rep.role_nombre || 'Control Financiero'
          });
        }
      } catch (error) {
        console.error('Error cargando reportes guardados:', error.message);
      }
    };
    fetchSavedReports();
  }, []);

  // Generar reporte nuevo con IA
  const handleGenerateAiReport = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/reporte', { 
        tipoReporte: periodType, 
        anio: Number(year), 
        mes: periodType === 'mensual' ? Number(month) : undefined, 
        semestre: periodType === 'semestral' ? Number(semester) : undefined
      });
      setAiReportHtml(response.data.analisis);

      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      let periodText = '';
      if (periodType === 'mensual') {
        periodText = `${nombresMeses[Number(month) - 1]} ${year}`;
      } else if (periodType === 'semestral') {
        periodText = `${Number(semester) === 1 ? 'Primer Semestre' : 'Segundo Semestre'} ${year}`;
      } else {
        periodText = `Año ${year}`;
      }

      setReportMetadata({
        generationDate: getFormattedNow(),
        periodText,
        author: user?.nombre || 'Antigravity AI Engine',
        role: user?.role_nombre || 'Control Financiero'
      });
      alert('Reporte Ejecutivo compilado y guardado en base de datos.');
    } catch (error) {
      alert(error.message || 'Error al compilar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  // Exportar proyectos a formato CSV pertenecientes únicamente al período seleccionado
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,Codigo Proceso,Nombre Proyecto,Direccion ID,Etapa,Proveedor,Forma de Gasto,F. Inicio,F. Fin,Presupuesto Asignado,Certificado,Comprometido,Devengado,Pagado,Saldo por pagar\n';

    // Filter projects by period
    let startDate, endDate;
    const yearNum = Number(year);
    if (periodType === 'mensual') {
      const monthNum = Number(month);
      startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    } else if (periodType === 'semestral') {
      const semNum = Number(semester);
      if (semNum === 1) {
        startDate = `${yearNum}-01-01`;
        endDate = `${yearNum}-06-30`;
      } else {
        startDate = `${yearNum}-07-01`;
        endDate = `${yearNum}-12-31`;
      }
    } else {
      startDate = `${yearNum}-01-01`;
      endDate = `${yearNum}-12-31`;
    }

    const filteredProjects = projects.filter(p => {
      return p.fecha_inicio <= endDate && p.fecha_fin >= startDate;
    });

    filteredProjects.forEach(p => {
      const devengado = p.presupuesto.devengado || 0;
      const pagado = p.presupuesto.pagado || 0;
      const saldoPagar = devengado - pagado;
      
      const row = [
        p.id,
        `"${p.codigo_proceso}"`,
        `"${p.nombre}"`,
        p.direccion_id,
        `"${p.etapa}"`,
        `"${p.proveedor_contratista || 'Por adjudicar'}"`,
        `"${p.forma_pago}"`,
        p.fecha_inicio,
        p.fecha_fin,
        p.presupuesto.presupuesto_asignado,
        p.presupuesto.certificado,
        p.presupuesto.comprometido,
        devengado,
        pagado,
        saldoPagar
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GADMR_POA_PAC_React_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Formulario previo a la exportación / Panel de Control */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 print:hidden">
        <div>
          <h3 className="font-title font-bold text-base text-slate-800 dark:text-white">
            Generación y Exportación de Reporte Ejecutivo
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Defina el período y año de los datos que desea consultar para generar el reporte o exportarlo a Excel.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-500">Período del Reporte:</label>
            <select 
              value={periodType} 
              onChange={(e) => setPeriodType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none transition-all text-slate-700 dark:text-slate-200"
            >
              <option value="mensual">Mensual</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-500">Año:</label>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none transition-all text-slate-700 dark:text-slate-200"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {periodType === 'mensual' && (
            <div className="flex flex-col gap-1.5 animate-fadeIn">
              <label className="font-semibold text-slate-500">Mes:</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none transition-all text-slate-700 dark:text-slate-200"
              >
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>
          )}

          {periodType === 'semestral' && (
            <div className="flex flex-col gap-1.5 animate-fadeIn">
              <label className="font-semibold text-slate-500">Semestre:</label>
              <select 
                value={semester} 
                onChange={(e) => setSemester(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none transition-all text-slate-700 dark:text-slate-200"
              >
                <option value="1">Primer Semestre (Enero - Junio)</option>
                <option value="2">Segundo Semestre (Julio - Diciembre)</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button 
            onClick={handleGenerateAiReport}
            disabled={loading}
            className="px-4 py-2.5 bg-[#134074] hover:bg-[#0B2545] text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? 'Generando...' : 'Generar Reporte'}
          </button>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all"
          >
            <Download className="h-4 w-4" />
            Exportar Excel (CSV)
          </button>
        </div>
      </div>

      {/* Renderizado de Reporte Imprimible */}
      {aiReportHtml && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto space-y-6 animate-fadeIn">
          
          {/* Encabezado Membretado */}
          <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[#D90429] rounded-lg flex items-center justify-center font-bold text-white shadow-md border border-yellow-400 overflow-hidden shrink-0">
                <img
                  src="https://registrodelapropiedadriobamba.gob.ec/assets/img/logo-cuadrado-f.webp"
                  alt="Logo GAD Riobamba"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="font-title font-bold text-xs tracking-wide text-slate-800 dark:text-white">
                  GOBIERNO AUTÓNOMO DESCENTRALIZADO MUNICIPAL DE RIOBAMBA
                </h2>
                <span className="text-[10px] font-semibold text-slate-500 tracking-wider">
                  DIRECCIÓN DE PLANIFICACIÓN / CONTROL PRESUPUESTARIO
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => window.print()}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 print:hidden"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir Reporte
            </button>
          </div>

          {/* Información automática del reporte */}
          {reportMetadata.generationDate && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-300">
              <div>
                <span className="font-bold block uppercase text-[8px] text-slate-400 mb-0.5">Fecha de generación:</span>
                <span>{reportMetadata.generationDate}</span>
              </div>
              <div>
                <span className="font-bold block uppercase text-[8px] text-slate-400 mb-0.5">Autor:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{reportMetadata.author}</span>
              </div>
              <div>
                <span className="font-bold block uppercase text-[8px] text-slate-400 mb-0.5">Rol:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{reportMetadata.role}</span>
              </div>
              <div>
                <span className="font-bold block uppercase text-[8px] text-slate-400 mb-0.5">Período consultado:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{reportMetadata.periodText}</span>
              </div>
            </div>
          )}
          
          {/* Cuerpo del Reporte parseado línea por línea */}
          <div className="prose max-w-none text-slate-750 dark:text-slate-300 space-y-4 text-xs leading-relaxed">
            {aiReportHtml.split('\n').map((line, idx) => {
              // Saltar líneas que contienen metadatos si ya los mostramos de forma estructurada arriba
              if (
                line.startsWith('**Fecha de Generación:**') || 
                line.startsWith('**Autor:**') || 
                line.startsWith('**Rol:**') || 
                line.startsWith('**Período Consultado:**')
              ) {
                return null;
              }

              if (line.startsWith('###')) {
                return (
                  <h3 key={idx} className="font-title font-bold text-sm text-[#0B2545] mt-6 mb-2 border-b pb-1 dark:text-white">
                    {line.replace('###', '')}
                  </h3>
                );
              }
              if (line.startsWith('####')) {
                return (
                  <h4 key={idx} className="font-title font-bold text-xs text-slate-800 mt-4 mb-2 dark:text-slate-200">
                    {line.replace('####', '')}
                  </h4>
                );
              }
              if (line.startsWith('---')) {
                return <hr key={idx} className="my-4 border-slate-200 dark:border-slate-800" />;
              }
              if (line.startsWith('*') || line.startsWith('-')) {
                const cleanLine = line.replace(/^[\*\-]\s*/, '');
                return (
                  <li 
                    key={idx} 
                    className="ml-4 list-disc" 
                    dangerouslySetInnerHTML={{ 
                      __html: cleanLine
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>') 
                    }} 
                  />
                );
              }
              return (
                <p 
                  key={idx} 
                  dangerouslySetInnerHTML={{ 
                    __html: line
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>') 
                  }} 
                />
              );
            })}
          </div>

          {/* Pie de página del reporte (imprimible) */}
          <div className="hidden print:flex items-center justify-between border-t pt-4 border-slate-200 text-[8px] text-slate-400 font-semibold uppercase tracking-wider">
            <span>Sistema de Control POA/PAC - GAD Municipal de Riobamba</span>
            <span>Página 1 de 1</span>
          </div>

        </div>
      )}

    </div>
  );
};

export default Reports;
