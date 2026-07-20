// projectService.js - Lógica de negocio para administración de proyectos, presupuestos e hitos
import * as projectRepository from '../repositories/projectRepository.js';
import * as auditService from './auditService.js';

// Validar consistencia de la cadena del gasto
// Regla: Presupuesto Asignado >= Certificado >= Comprometido >= Devengado >= Pagado
export const validateBudgetChain = (presupuesto) => {
  const asignado = Number(presupuesto.presupuesto_asignado || 0);
  const certificado = Number(presupuesto.certificado || 0);
  const comprometido = Number(presupuesto.comprometido || 0);
  const devengado = Number(presupuesto.devengado || 0);
  const pagado = Number(presupuesto.pagado || 0);

  return (asignado >= certificado) && 
         (certificado >= comprometido) && 
         (comprometido >= devengado) && 
         (devengado >= pagado);
};

// Crear Proyecto
export const createProject = async (projectData, userId) => {
  const partidas = projectData.partidas || [];
  const totalAsignado = partidas.reduce((sum, p) => sum + Number(p.monto_asignado), 0);
  
  // Asignar el total de partidas al presupuesto asignado del proyecto
  projectData.presupuesto.presupuesto_asignado = totalAsignado;
  
  if (!validateBudgetChain(projectData.presupuesto)) {
    throw new Error('Existen errores en la cadena del gasto presupuestaria. Se debe cumplir: Asignado >= Certificado >= Comprometido >= Devengado >= Pagado.');
  }

  // Generar hitos de pago (pagos programados)
  const pagos = [];
  const { fecha_inicio, fecha_fin, forma_pago, presupuesto } = projectData;
  const pagadoMonto = Number(presupuesto.pagado || 0);
  const fechaPago = presupuesto.fecha_pago || null;

  if (forma_pago !== 'Contra entrega') {
    pagos.push({
      descripcion: 'Anticipo de Contrato',
      monto: totalAsignado * 0.3,
      fecha_prevista: fecha_inicio,
      fecha_real_pago: pagadoMonto >= (totalAsignado * 0.3) ? (fechaPago || fecha_inicio) : null,
      estado: pagadoMonto >= (totalAsignado * 0.3) ? 'Pagado' : 'Programado'
    });
    pagos.push({
      descripcion: 'Entregable / Planilla Final',
      monto: totalAsignado * 0.7,
      fecha_prevista: fecha_fin,
      fecha_real_pago: null,
      estado: 'Programado'
    });
  } else {
    pagos.push({
      descripcion: 'Liquidación y Pago Único',
      monto: totalAsignado,
      fecha_prevista: fecha_fin,
      fecha_real_pago: pagadoMonto >= totalAsignado ? (fechaPago || fecha_fin) : null,
      estado: pagadoMonto >= totalAsignado ? 'Pagado' : 'Programado'
    });
  }

  // Guardar en base de datos
  const projectId = await projectRepository.create(projectData, partidas, pagos);

  // Guardar historial de etapas inicial
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await projectRepository.saveStageChange(projectId, 'Ninguna (Registro)', projectData.etapa, userId, nowStr);

  // Registro de Auditoría
  await auditService.logAudit(userId, 'Crear Proyecto', 'proyectos', `Registró el proyecto: ${projectData.nombre} (${projectData.codigo_proceso})`);

  return projectId;
};

// Editar Proyecto
export const updateProject = async (id, updateData, userId) => {
  const oldProject = await projectRepository.getById(id);
  if (!oldProject) {
    throw new Error('Proyecto no encontrado.');
  }

  const partidas = updateData.partidas || [];
  const totalAsignado = partidas.reduce((sum, p) => sum + Number(p.monto_asignado), 0);
  updateData.presupuesto.presupuesto_asignado = totalAsignado;

  if (!validateBudgetChain(updateData.presupuesto)) {
    throw new Error('Existen errores en la cadena del gasto presupuestaria. Se debe cumplir: Asignado >= Certificado >= Comprometido >= Devengado >= Pagado.');
  }

  // Guardar actualizaciones en la BD
  await projectRepository.update(id, updateData, partidas);

  // Guardar historial si la etapa cambió
  if (oldProject.etapa !== updateData.etapa) {
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await projectRepository.saveStageChange(id, oldProject.etapa, updateData.etapa, userId, nowStr);
  }

  // Registro de Auditoría
  await auditService.logAudit(userId, 'Editar Proyecto', 'proyectos', `Modificó el proyecto ID: ${id} (${updateData.nombre})`);

  return true;
};

// Registrar Hito de Pago Procesado
export const registerPayment = async (projectId, paymentId, dateReal, userId) => {
  const project = await projectRepository.getById(projectId);
  if (!project) {
    throw new Error('Proyecto no encontrado.');
  }

  const payment = project.pagos.find(p => p.id === Number(paymentId));
  if (!payment) {
    throw new Error('Hito de pago no encontrado en el proyecto.');
  }

  if (payment.estado === 'Pagado') {
    throw new Error('El hito de pago ya ha sido procesado anteriormente.');
  }

  // Registrar el pago en el hito
  await projectRepository.updatePaymentStatus(paymentId, dateReal, 'Pagado');

  // Recalcular métricas de la cadena del gasto
  const monto = Number(payment.monto);
  const newPagado = Number(project.presupuesto.pagado || 0) + monto;
  const newDevengado = Math.max(Number(project.presupuesto.devengado || 0), newPagado);
  const newComprometido = Math.max(Number(project.presupuesto.comprometido || 0), newDevengado);
  const newCertificado = Math.max(Number(project.presupuesto.certificado || 0), newComprometido);

  const updatedBudget = {
    ...project.presupuesto,
    pagado: newPagado,
    fecha_pago: dateReal,
    devengado: newDevengado,
    fecha_devengado: dateReal,
    comprometido: newComprometido,
    fecha_compromiso: dateReal,
    certificado: newCertificado,
    fecha_certificacion: dateReal
  };

  let finalEtapa = project.etapa;

  // Si se devengó todo el presupuesto asignado, cambiar etapa a Cierre
  if (newDevengado >= project.presupuesto.presupuesto_asignado) {
    finalEtapa = 'Cierre';
    const hTimeStr = dateReal + ' 17:00:00';
    await projectRepository.saveStageChange(projectId, project.etapa, 'Cierre', userId, hTimeStr);
  }

  const updatedProjectData = {
    ...project,
    etapa: finalEtapa,
    presupuesto: updatedBudget
  };

  // Guardar cambios presupuestarios recalculados en la BD
  await projectRepository.update(projectId, updatedProjectData, project.partidas);

  // Registro de Auditoría
  await auditService.logAudit(
    userId,
    'Registrar Pago',
    'pagos_programados',
    `Desembolsó el hito '${payment.descripcion}' por un monto de $${monto.toLocaleString('en-US')} para el proyecto: ${project.nombre}`
  );

  return true;
};

// Eliminar Proyecto
export const deleteProject = async (id, userId) => {
  const project = await projectRepository.getById(id);
  if (!project) {
    throw new Error('Proyecto no encontrado.');
  }

  await projectRepository.remove(id);

  // Registro de Auditoría
  await auditService.logAudit(userId, 'Eliminar Proyecto', 'proyectos', `Eliminó el proyecto: ${project.nombre}`);

  return true;
};
