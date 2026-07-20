// reportRepository.js - Repositorio para guardar y consultar Reportes IA en SQL Server
import { query } from '../database/connection.js';

export const getReports = async () => {
  const result = await query(`
    SELECT r.*, u.nombre as usuario_nombre, rl.nombre as role_nombre
    FROM dbo.reportes_ia r
    JOIN dbo.usuarios u ON r.usuario_id = u.id
    JOIN dbo.roles rl ON u.role_id = rl.id
    ORDER BY r.id DESC
  `);
  return result.recordset.map(r => ({
    id: r.id,
    fecha_generacion: r.fecha_generacion.toISOString().slice(0, 19).replace('T', ' '),
    analisis_texto: r.analisis_texto,
    metadata: r.metadata,
    proyecto_id: r.proyecto_id,
    direccion_id: r.direccion_id,
    usuario_id: r.usuario_id,
    tipo_reporte: r.tipo_reporte,
    usuario_nombre: r.usuario_nombre,
    role_nombre: r.role_nombre
  }));
};

export const saveReport = async ({ fecha_generacion, analisis_texto, metadata, proyecto_id, direccion_id, usuario_id, tipo_reporte }) => {
  await query(
    `INSERT INTO dbo.reportes_ia (fecha_generacion, analisis_texto, metadata, proyecto_id, direccion_id, usuario_id, tipo_reporte)
     VALUES (@fecha_generacion, @analisis_texto, @metadata, @proyecto_id, @direccion_id, @usuario_id, @tipo_reporte)`,
    {
      fecha_generacion,
      analisis_texto,
      metadata: metadata || null,
      proyecto_id: proyecto_id || null,
      direccion_id: direccion_id || null,
      usuario_id,
      tipo_reporte
    }
  );
};
