// commonRepository.js - Repositorio para catálogos y auditoría en SQL Server
import { query } from '../database/connection.js';

export const getRoles = async () => {
  const result = await query('SELECT * FROM dbo.roles ORDER BY id ASC');
  return result.recordset;
};

export const getDirecciones = async () => {
  const result = await query('SELECT * FROM dbo.direcciones ORDER BY id ASC');
  // Parsear la cadena JSON de objetivos a un array
  return result.recordset.map(dir => ({
    id: dir.id,
    nombre: dir.nombre,
    sigla: dir.sigla,
    objetivos: dir.objetivos ? JSON.parse(dir.objetivos) : []
  }));
};

export const getPartidas = async () => {
  const result = await query('SELECT * FROM dbo.partidas_presupuestarias ORDER BY codigo ASC');
  return result.recordset;
};

export const getHistorialEtapas = async () => {
  const result = await query(`
    SELECT h.*, p.nombre as proyecto_nombre, u.nombre as usuario_nombre
    FROM dbo.historial_etapas h
    LEFT JOIN dbo.proyectos p ON h.proyecto_id = p.id
    LEFT JOIN dbo.usuarios u ON h.usuario_id = u.id
    ORDER BY h.id DESC
  `);
  return result.recordset.map(h => ({
    id: h.id,
    proyecto_id: h.proyecto_id,
    proyecto_nombre: h.proyecto_nombre,
    etapa_anterior: h.etapa_anterior,
    etapa_nueva: h.etapa_nueva,
    fecha_cambio: h.fecha_cambio.toISOString().slice(0, 19).replace('T', ' '),
    usuario_id: h.usuario_id,
    usuario_nombre: h.usuario_nombre
  }));
};

export const getAuditLogs = async () => {
  const result = await query(`
    SELECT a.*, u.nombre as usuario_nombre
    FROM dbo.audit_logs a
    LEFT JOIN dbo.usuarios u ON a.usuario_id = u.id
    ORDER BY a.fecha DESC
  `);
  return result.recordset.map(log => ({
    id: log.id,
    usuario_id: log.usuario_id,
    usuario_nombre: log.usuario_nombre,
    accion: log.accion,
    tabla_afectada: log.tabla_afectada,
    detalles: log.detalles,
    fecha: log.fecha.toISOString().slice(0, 19).replace('T', ' ')
  }));
};

export const addAuditLog = async ({ usuarioId, accion, tablaAfectada, detalles, fecha }) => {
  await query(
    `INSERT INTO dbo.audit_logs (usuario_id, accion, tabla_afectada, detalles, fecha)
     VALUES (@usuarioId, @accion, @tablaAfectada, @detalles, @fecha)`,
    {
      usuarioId: usuarioId || null,
      accion,
      tablaAfectada,
      detalles,
      fecha
    }
  );
};
