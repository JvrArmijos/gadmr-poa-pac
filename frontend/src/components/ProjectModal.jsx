// ProjectModal.jsx - Formulario de registro y edición de proyectos POA/PAC
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { formatUSD } from '../utils/format.js';
import ProjectLocationPicker from './mapa/ProjectLocationPicker.jsx';

export const ProjectModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingProject, 
  directions, 
  partidas, 
  user 
}) => {
  const isDirector = user?.role_nombre?.toLowerCase().includes('director');

  // --- Estados de Formulario ---
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDirection, setFormDirection] = useState(1);
  const [formPoa, setFormPoa] = useState('');
  const [formPac, setFormPac] = useState('');
  const [formContractor, setFormContractor] = useState('');
  const [formPaymentType, setFormPaymentType] = useState('Contra entrega');
  const [formStage, setFormStage] = useState('Preparatoria');
  const [formDateStart, setFormDateStart] = useState('');
  const [formDateEnd, setFormDateEnd] = useState('');
  const [formDuration, setFormDuration] = useState(0);
  
  // Georreferenciación
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  
  // Partidas asociadas al formulario
  const [formPartidasAdded, setFormPartidasAdded] = useState([]);
  const [formPartidaSelect, setFormPartidaSelect] = useState('');
  const [formPartidaMonto, setFormPartidaMonto] = useState('');

  // Cadena del Gasto
  const [formBudgetCertified, setFormBudgetCertified] = useState('');
  const [formBudgetCertifiedDate, setFormBudgetCertifiedDate] = useState('');
  const [formBudgetCommitted, setFormBudgetCommitted] = useState('');
  const [formBudgetCommittedDate, setFormBudgetCommittedDate] = useState('');
  const [formBudgetDevenged, setFormBudgetDevenged] = useState('');
  const [formBudgetDevengedDate, setFormBudgetDevengedDate] = useState('');
  const [formBudgetPaid, setFormBudgetPaid] = useState('');
  const [formBudgetPaidDate, setFormBudgetPaidDate] = useState('');
  
  const [formValidationError, setFormValidationError] = useState(false);

  // Inicializar o limpiar campos al abrir/cambiar modo
  useEffect(() => {
    if (!isOpen) return;

    if (partidas.length > 0) {
      setFormPartidaSelect(partidas[0].codigo);
    }

    if (editingProject) {
      // Cargar datos si estamos editando
      setFormName(editingProject.nombre);
      setFormCode(editingProject.codigo_proceso);
      setFormDirection(editingProject.direccion_id);
      setFormPoa(editingProject.vinculacion_poa);
      setFormPac(editingProject.vinculacion_pac);
      setFormContractor(editingProject.proveedor_contratista || '');
      setFormPaymentType(editingProject.forma_pago);
      setFormStage(editingProject.etapa);
      setFormDateStart(editingProject.fecha_inicio);
      setFormDateEnd(editingProject.fecha_fin);
      setFormDuration(editingProject.duracion_dias);
      setFormPartidasAdded([...editingProject.partidas]);

      // Latitud / Longitud
      setFormLat(editingProject.latitud || '');
      setFormLng(editingProject.longitud || '');

      const p = editingProject.presupuesto;
      setFormBudgetCertified(p.certificado ? String(p.certificado) : '');
      setFormBudgetCertifiedDate(p.fecha_certificacion || '');
      setFormBudgetCommitted(p.comprometido ? String(p.comprometido) : '');
      setFormBudgetCommittedDate(p.fecha_compromiso || '');
      setFormBudgetDevenged(p.devengado ? String(p.devengado) : '');
      setFormBudgetDevengedDate(p.fecha_devengado || '');
      setFormBudgetPaid(p.pagado ? String(p.pagado) : '');
      setFormBudgetPaidDate(p.fecha_pago || '');
      setFormValidationError(false);
    } else {
      // Limpiar datos para nuevo registro
      setFormName('');
      setFormCode('');
      setFormDirection(isDirector && user.direccion_id ? user.direccion_id : 1);
      setFormPoa('');
      setFormPac('');
      setFormContractor('');
      setFormPaymentType('Contra entrega');
      setFormStage('Preparatoria');
      setFormDateStart('');
      setFormDateEnd('');
      setFormDuration(0);
      setFormPartidasAdded([]);
      setFormPartidaMonto('');
      
      // Reset lat/lng
      setFormLat('');
      setFormLng('');
      
      setFormBudgetCertified('');
      setFormBudgetCertifiedDate('');
      setFormBudgetCommitted('');
      setFormBudgetCommittedDate('');
      setFormBudgetDevenged('');
      setFormBudgetDevengedDate('');
      setFormBudgetPaid('');
      setFormBudgetPaidDate('');
      setFormValidationError(false);
    }
  }, [isOpen, editingProject, partidas, isDirector, user]);

  if (!isOpen) return null;

  // Calcular duración al seleccionar fechas
  const calculateFormDuration = (start, end) => {
    setFormDateStart(start);
    setFormDateEnd(end);
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diff = d2.getTime() - d1.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setFormDuration(days > 0 ? days : 0);
    }
  };

  // Añadir partida presupuestaria al listado local
  const handleAddPartidaToForm = () => {
    if (!formPartidaMonto || Number(formPartidaMonto) <= 0) {
      alert('Ingrese un monto de partida válido.');
      return;
    }
    if (formPartidasAdded.some(p => p.codigo === formPartidaSelect)) {
      alert('La partida seleccionada ya está agregada.');
      return;
    }

    setFormPartidasAdded([
      ...formPartidasAdded,
      { codigo: formPartidaSelect, monto_asignado: Number(formPartidaMonto) }
    ]);
    setFormPartidaMonto('');
  };

  // Eliminar partida del listado local
  const handleRemovePartidaFromForm = (codigo) => {
    setFormPartidasAdded(formPartidasAdded.filter(p => p.codigo !== codigo));
  };

  // Validar cadena del gasto
  const validateChain = (certified, committed, devenged, paid, totalAsignado) => {
    const isValid = (totalAsignado >= certified) && 
                    (certified >= committed) && 
                    (committed >= devenged) && 
                    (devenged >= paid);
    setFormValidationError(!isValid);
    return isValid;
  };

  // Guardar formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    if (formPartidasAdded.length === 0) {
      alert('Agregue al menos una partida presupuestaria.');
      return;
    }

    const totalAsignado = formPartidasAdded.reduce((sum, p) => sum + Number(p.monto_asignado), 0);
    const certified = Number(formBudgetCertified || 0);
    const committed = Number(formBudgetCommitted || 0);
    const devenged = Number(formBudgetDevenged || 0);
    const paid = Number(formBudgetPaid || 0);

    if (!validateChain(certified, committed, devenged, paid, totalAsignado)) {
      alert('Existen errores en la cadena del gasto presupuestaria. Verifique la regla: Asignado >= Certificado >= Comprometido >= Devengado >= Pagado.');
      return;
    }

    const projectPayload = {
      nombre: formName,
      codigo_proceso: formCode,
      direccion_id: Number(formDirection),
      vinculacion_poa: formPoa,
      vinculacion_pac: formPac,
      etapa: formStage,
      proveedor_contratista: formContractor,
      forma_pago: formPaymentType,
      fecha_inicio: formDateStart,
      fecha_fin: formDateEnd,
      duracion_dias: formDuration,
      latitud: formLat !== '' ? Number(formLat) : null,
      longitud: formLng !== '' ? Number(formLng) : null,
      partidas: formPartidasAdded,
      presupuesto: {
        presupuesto_asignado: totalAsignado,
        certificado,
        fecha_certificacion: formBudgetCertifiedDate || null,
        comprometido,
        fecha_compromiso: formBudgetCommittedDate || null,
        devengado: devenged,
        fecha_devengado: formBudgetDevengedDate || null,
        pagado: paid,
        fecha_pago: formBudgetPaidDate || null
      }
    };

    onSave(projectPayload);
  };

  const totalAsignadoCalculado = formPartidasAdded.reduce((sum, p) => sum + Number(p.monto_asignado), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border overflow-hidden">
        
        {/* Cabecera */}
        <div className="bg-[#0B2545] text-white px-6 py-4 flex justify-between items-center">
          <h2 className="font-title font-bold text-base">
            {editingProject ? 'Editar Proyecto POA/PAC' : 'Registrar Nuevo Proyecto POA/PAC'}
          </h2>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-2">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs">
          
          {/* Sección 1: Identificación */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              1. Identificación y Responsabilidad
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-slate-500 mb-1">Nombre del Proyecto: *</label>
                <input 
                  type="text" 
                  required 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="Nombre completo de la obra..." 
                  className="w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Código del Proceso: *</label>
                <input 
                  type="text" 
                  required 
                  value={formCode} 
                  onChange={(e) => setFormCode(e.target.value)} 
                  placeholder="MCO-GADMR-001-2026" 
                  className="w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Dirección responsable: *</label>
                <select 
                  value={formDirection} 
                  onChange={(e) => setFormDirection(Number(e.target.value))}
                  disabled={isDirector}
                  className="w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none"
                >
                  {directions.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Vinculación POA: *</label>
                <input 
                  type="text" 
                  required 
                  value={formPoa} 
                  onChange={(e) => setFormPoa(e.target.value)} 
                  placeholder="Eje 1: Vialidad" 
                  className="w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Vinculación PAC: *</label>
                <input 
                  type="text" 
                  required 
                  value={formPac} 
                  onChange={(e) => setFormPac(e.target.value)} 
                  placeholder="Item PAC 100" 
                  className="w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Plazos */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              2. Plazos y Contratos
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 mb-1">Contratista / Proveedor:</label>
                <input 
                  type="text" 
                  value={formContractor} 
                  onChange={(e) => setFormContractor(e.target.value)} 
                  placeholder="Constructora..." 
                  className="w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Forma de Pago:</label>
                <select 
                  value={formPaymentType} 
                  onChange={(e) => setFormPaymentType(e.target.value)} 
                  className="w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="Contra entrega">Contra entrega</option>
                  <option value="Pagos parciales">Pagos parciales</option>
                  <option value="Pagos mensuales">Pagos mensuales</option>
                  <option value="Con anticipo">Con anticipo</option>
                  <option value="Sin anticipo">Sin anticipo</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Etapa actual: *</label>
                <select 
                  value={formStage} 
                  onChange={(e) => setFormStage(e.target.value)} 
                  className="w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="Preparatoria">Preparatoria (Gris)</option>
                  <option value="Precontractual">Precontractual (Azul)</option>
                  <option value="Contractual">Contractual (Naranja)</option>
                  <option value="Ejecución">Ejecución (Verde)</option>
                  <option value="Cierre">Cierre (Morado)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">F. Inicio: *</label>
                <input 
                  type="date" 
                  required 
                  value={formDateStart} 
                  onChange={(e) => calculateFormDuration(e.target.value, formDateEnd)} 
                  className="w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">F. Fin: *</label>
                <input 
                  type="date" 
                  required 
                  value={formDateEnd} 
                  onChange={(e) => calculateFormDuration(formDateStart, e.target.value)} 
                  className="w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Duración (Días):</label>
                <input 
                  type="number" 
                  readOnly 
                  value={formDuration} 
                  className="w-full bg-slate-100 dark:bg-slate-800 border rounded-xl px-3 py-2 text-slate-400 focus:outline-none" 
                />
              </div>
            </div>
          </div>

          {/* UBICACIÓN DEL PROYECTO (MAPA) */}
          <div className="border-t pt-4">
            <span className="text-[10px] font-bold text-[#134074] dark:text-[#8DA9C4] uppercase tracking-wider block mb-1">
              UBICACIÓN DEL PROYECTO (MAPA)
            </span>
            <p className="text-[10px] text-slate-450 mb-3">
              Haz clic en el mapa para fijar la ubicación de la obra o ingresa las coordenadas manualmente.
            </p>
            <ProjectLocationPicker 
              lat={formLat} 
              lng={formLng} 
              onChange={(lat, lng) => {
                setFormLat(lat);
                setFormLng(lng);
              }}
            />
          </div>

          {/* Sección 3: Partidas Presupuestarias */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              3. Partida Presupuestaria POA
            </span>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="md:col-span-6">
                <label className="block text-slate-500 mb-1">Seleccionar Partida:</label>
                <select 
                  value={formPartidaSelect} 
                  onChange={(e) => setFormPartidaSelect(e.target.value)} 
                  className="w-full bg-white dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none"
                >
                  {partidas.map(p => (
                    <option key={p.codigo} value={p.codigo}>{p.codigo} - {p.denominacion}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="block text-slate-500 mb-1">Monto Asignado (USD):</label>
                <input 
                  type="number" 
                  value={formPartidaMonto} 
                  onChange={(e) => setFormPartidaMonto(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full bg-white dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none" 
                />
              </div>
              <div className="md:col-span-2">
                <button 
                  type="button" 
                  onClick={handleAddPartidaToForm} 
                  className="w-full py-2 bg-[#134074] hover:bg-[#0B2545] text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  <Plus className="h-4.5 w-4.5" /> Añadir
                </button>
              </div>
            </div>

            {/* Listado de partidas agregadas */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[11px] text-slate-500 dark:text-slate-400">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-800">
                    <th className="px-2 py-1.5">Código Partida</th>
                    <th className="px-2 py-1.5 text-right">Monto</th>
                    <th className="px-2 py-1.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {formPartidasAdded.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-2 py-3 text-center text-slate-400">
                        Asocie al menos una partida presupuestaria.
                      </td>
                    </tr>
                  ) : (
                    formPartidasAdded.map(p => (
                      <tr key={p.codigo} className="border-b dark:border-slate-800">
                        <td className="px-2 py-1.5 font-mono text-slate-700 dark:text-slate-300">{p.codigo}</td>
                        <td className="px-2 py-1.5 text-right font-bold text-slate-850 dark:text-white">
                          {formatUSD(p.monto_asignado)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemovePartidaFromForm(p.codigo)} 
                            className="text-[#D90429] hover:underline"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="text-right font-bold text-slate-700 dark:text-slate-300 mt-2">
                Presupuesto Asignado Total: {formatUSD(totalAsignadoCalculado)}
              </div>
            </div>
          </div>

          {/* Sección 4: Cadena del Gasto */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                4. Cadena del Gasto Presupuestario
              </span>
              {formValidationError && (
                <span className="text-[10px] font-bold text-[#D90429]">
                  Inconsistencia detectada (Regla: Asignado &gt;= Certificado &gt;= Comprometido &gt;= Devengado &gt;= Pagado)
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-500 mb-1">Monto Certificado:</label>
                <input 
                  type="number" 
                  value={formBudgetCertified} 
                  onChange={(e) => setFormBudgetCertified(e.target.value)} 
                  placeholder="0.00" 
                  className={`w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none ${formValidationError ? 'border-[#D90429]' : ''}`} 
                />
                <input 
                  type="date" 
                  value={formBudgetCertifiedDate} 
                  onChange={(e) => setFormBudgetCertifiedDate(e.target.value)} 
                  className="w-full mt-1 border rounded px-2 py-1 text-[10px] dark:bg-slate-800 focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Monto Comprometido:</label>
                <input 
                  type="number" 
                  value={formBudgetCommitted} 
                  onChange={(e) => setFormBudgetCommitted(e.target.value)} 
                  placeholder="0.00" 
                  className={`w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none ${formValidationError ? 'border-[#D90429]' : ''}`} 
                />
                <input 
                  type="date" 
                  value={formBudgetCommittedDate} 
                  onChange={(e) => setFormBudgetCommittedDate(e.target.value)} 
                  className="w-full mt-1 border rounded px-2 py-1 text-[10px] dark:bg-slate-800 focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Monto Devengado:</label>
                <input 
                  type="number" 
                  value={formBudgetDevenged} 
                  onChange={(e) => setFormBudgetDevenged(e.target.value)} 
                  placeholder="0.00" 
                  className={`w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none ${formValidationError ? 'border-[#D90429]' : ''}`} 
                />
                <input 
                  type="date" 
                  value={formBudgetDevengedDate} 
                  onChange={(e) => setFormBudgetDevengedDate(e.target.value)} 
                  className="w-full mt-1 border rounded px-2 py-1 text-[10px] dark:bg-slate-800 focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Monto Pagado:</label>
                <input 
                  type="number" 
                  value={formBudgetPaid} 
                  onChange={(e) => setFormBudgetPaid(e.target.value)} 
                  placeholder="0.00" 
                  className={`w-full bg-slate-55 dark:bg-slate-800 border rounded-xl px-3 py-2 focus:outline-none ${formValidationError ? 'border-[#D90429]' : ''}`} 
                />
                <input 
                  type="date" 
                  value={formBudgetPaidDate} 
                  onChange={(e) => setFormBudgetPaidDate(e.target.value)} 
                  className="w-full mt-1 border rounded px-2 py-1 text-[10px] dark:bg-slate-800 focus:outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
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
              className="px-4 py-2 bg-[#134074] hover:bg-[#0B2545] text-white font-bold rounded-xl shadow-sm transition-all"
            >
              Guardar Proyecto
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ProjectModal;
