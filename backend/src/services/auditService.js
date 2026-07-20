// auditService.js - Servicio de auditoría y registros (logs) del sistema
import * as commonRepository from '../repositories/commonRepository.js';

export const logAudit = async (usuarioId, accion, tablaAfectada, detalles) => {
  try {
    const now = new Date();
    const formatDigit = (n) => (n < 10 ? '0' + n : n);
    const nowStr = `${now.getFullYear()}-${formatDigit(now.getMonth() + 1)}-${formatDigit(now.getDate())} ${formatDigit(now.getHours())}:${formatDigit(now.getMinutes())}:${formatDigit(now.getSeconds())}`;

    await commonRepository.addAuditLog({
      usuarioId,
      accion,
      tablaAfectada,
      detalles,
      fecha: nowStr
    });
  } catch (error) {
    // Evitar que un fallo de auditoría rompa el flujo principal
    console.error('Error al registrar log de auditoría:', error.message);
  }
};
