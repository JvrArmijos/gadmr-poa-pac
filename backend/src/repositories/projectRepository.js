// projectRepository.js - Acceso a datos de Proyectos, Partidas y Pagos en SQL Server
import { query, getPool, sql } from '../database/connection.js';

// Fecha de referencia para simulación del GADMR
const SIM_DATE = '2026-06-30';

export const getAll = async (filters = {}) => {
  const pool = await getPool();
  let sqlQuery = `
    SELECT p.*, d.sigla as direccion_sigla, d.nombre as direccion_nombre
    FROM dbo.proyectos p
    JOIN dbo.direcciones d ON p.direccion_id = d.id
    WHERE 1=1
  `;
  
  const request = pool.request();
  
  if (filters.search) {
    sqlQuery += ' AND (p.nombre LIKE @search OR p.codigo_proceso LIKE @search)';
    request.input('search', `%${filters.search}%`);
  }
  
  if (filters.direccionId) {
    sqlQuery += ' AND p.direccion_id = @direccionId';
    request.input('direccionId', Number(filters.direccionId));
  }
  
  if (filters.etapa) {
    sqlQuery += ' AND p.etapa = @etapa';
    request.input('etapa', filters.etapa);
  }
  
  if (filters.paymentStatus === 'Vencido') {
    sqlQuery += `
      AND p.id IN (
        SELECT DISTINCT proyecto_id 
        FROM dbo.pagos_programados 
        WHERE estado <> 'Pagado' AND fecha_prevista < @simDate
      )
    `;
    request.input('simDate', SIM_DATE);
  } else if (filters.paymentStatus === 'Correcto') {
    sqlQuery += `
      AND p.id NOT IN (
        SELECT DISTINCT proyecto_id 
        FROM dbo.pagos_programados 
        WHERE estado <> 'Pagado' AND fecha_prevista < @simDate
      )
    `;
    request.input('simDate', SIM_DATE);
  }

  sqlQuery += ' ORDER BY p.id ASC';
  
  const projectsResult = await request.query(sqlQuery);
  const projects = projectsResult.recordset;
  
  if (projects.length === 0) return [];

  // Obtener todas las partidas y pagos para estos proyectos
  const projectIds = projects.map(p => p.id);
  
  // Consulta de partidas asociadas
  const partidasQuery = `
    SELECT pp.*, p_cat.denominacion
    FROM dbo.proyecto_partidas pp
    JOIN dbo.partidas_presupuestarias p_cat ON pp.partida_codigo = p_cat.codigo
    WHERE pp.proyecto_id IN (${projectIds.join(',')})
  `;
  const partidasResult = await pool.request().query(partidasQuery);
  
  // Consulta de pagos asociados
  const pagosQuery = `
    SELECT * FROM dbo.pagos_programados 
    WHERE proyecto_id IN (${projectIds.join(',')})
    ORDER BY fecha_prevista ASC
  `;
  const pagosResult = await pool.request().query(pagosQuery);

  // Mapear y unir los datos
  return projects.map(proj => {
    // Normalizar nombres de propiedades de BD a coincidir con la UI antigua
    const pPartidas = partidasResult.recordset
      .filter(part => part.proyecto_id === proj.id)
      .map(part => ({
        codigo: part.partida_codigo,
        monto_asignado: Number(part.monto_asignado),
        denominacion: part.denominacion
      }));

    const pPagos = pagosResult.recordset
      .filter(pay => pay.proyecto_id === proj.id)
      .map(pay => ({
        id: pay.id,
        descripcion: pay.descripcion,
        monto: Number(pay.monto),
        fecha_prevista: pay.fecha_prevista.toISOString().slice(0, 10),
        fecha_real_pago: pay.fecha_real_pago ? pay.fecha_real_pago.toISOString().slice(0, 10) : null,
        estado: pay.estado
      }));

    return {
      id: proj.id,
      nombre: proj.nombre,
      codigo_proceso: proj.codigo_proceso,
      direccion_id: proj.direccion_id,
      direccion_sigla: proj.direccion_sigla,
      direccion_nombre: proj.direccion_nombre,
      vinculacion_poa: proj.vinculacion_poa,
      vinculacion_pac: proj.vinculacion_pac,
      etapa: proj.etapa,
      proveedor_contratista: proj.proveedor_contratista,
      forma_pago: proj.forma_pago,
      fecha_inicio: proj.fecha_inicio.toISOString().slice(0, 10),
      fecha_fin: proj.fecha_fin.toISOString().slice(0, 10),
      duracion_dias: proj.duracion_dias,
      partidas: pPartidas,
      presupuesto: {
        presupuesto_asignado: Number(proj.presupuesto_asignado),
        certificado: Number(proj.certificado),
        fecha_certificacion: proj.fecha_certificacion ? proj.fecha_certificacion.toISOString().slice(0, 10) : null,
        comprometido: Number(proj.comprometido),
        fecha_compromiso: proj.fecha_compromiso ? proj.fecha_compromiso.toISOString().slice(0, 10) : null,
        devengado: Number(proj.devengado),
        fecha_devengado: proj.fecha_devengado ? proj.fecha_devengado.toISOString().slice(0, 10) : null,
        pagado: Number(proj.pagado),
        fecha_pago: proj.fecha_pago ? proj.fecha_pago.toISOString().slice(0, 10) : null
      },
      pagos: pPagos,
      ubicacion: proj.latitud ? { lat: Number(proj.latitud), lng: Number(proj.longitud) } : null
    };
  });
};

export const getById = async (id) => {
  const pool = await getPool();
  const projectResult = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT p.*, d.sigla as direccion_sigla, d.nombre as direccion_nombre
      FROM dbo.proyectos p
      JOIN dbo.direcciones d ON p.direccion_id = d.id
      WHERE p.id = @id
    `);

  const proj = projectResult.recordset[0];
  if (!proj) return null;

  const partidasResult = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT pp.*, p_cat.denominacion
      FROM dbo.proyecto_partidas pp
      JOIN dbo.partidas_presupuestarias p_cat ON pp.partida_codigo = p_cat.codigo
      WHERE pp.proyecto_id = @id
    `);

  const pagosResult = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM dbo.pagos_programados WHERE proyecto_id = @id ORDER BY fecha_prevista ASC');

  const pPartidas = partidasResult.recordset.map(part => ({
    codigo: part.partida_codigo,
    monto_asignado: Number(part.monto_asignado),
    denominacion: part.denominacion
  }));

  const pPagos = pagosResult.recordset.map(pay => ({
    id: pay.id,
    descripcion: pay.descripcion,
    monto: Number(pay.monto),
    fecha_prevista: pay.fecha_prevista.toISOString().slice(0, 10),
    fecha_real_pago: pay.fecha_real_pago ? pay.fecha_real_pago.toISOString().slice(0, 10) : null,
    estado: pay.estado
  }));

  return {
    id: proj.id,
    nombre: proj.nombre,
    codigo_proceso: proj.codigo_proceso,
    direccion_id: proj.direccion_id,
    direccion_sigla: proj.direccion_sigla,
    direccion_nombre: proj.direccion_nombre,
    vinculacion_poa: proj.vinculacion_poa,
    vinculacion_pac: proj.vinculacion_pac,
    etapa: proj.etapa,
    proveedor_contratista: proj.proveedor_contratista,
    forma_pago: proj.forma_pago,
    fecha_inicio: proj.fecha_inicio.toISOString().slice(0, 10),
    fecha_fin: proj.fecha_fin.toISOString().slice(0, 10),
    duracion_dias: proj.duracion_dias,
    partidas: pPartidas,
    presupuesto: {
      presupuesto_asignado: Number(proj.presupuesto_asignado),
      certificado: Number(proj.certificado),
      fecha_certificacion: proj.fecha_certificacion ? proj.fecha_certificacion.toISOString().slice(0, 10) : null,
      comprometido: Number(proj.comprometido),
      fecha_compromiso: proj.fecha_compromiso ? proj.fecha_compromiso.toISOString().slice(0, 10) : null,
      devengado: Number(proj.devengado),
      fecha_devengado: proj.fecha_devengado ? proj.fecha_devengado.toISOString().slice(0, 10) : null,
      pagado: Number(proj.pagado),
      fecha_pago: proj.fecha_pago ? proj.fecha_pago.toISOString().slice(0, 10) : null
    },
    pagos: pPagos,
    ubicacion: proj.latitud ? { lat: Number(proj.latitud), lng: Number(proj.longitud) } : null
  };
};

export const create = async (projectData, partidas, pagos) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    // Insertar en la tabla proyectos
    const request = new sql.Request(transaction);
    request.input('nombre', sql.NVarChar, projectData.nombre);
    request.input('codigo_proceso', sql.NVarChar, projectData.codigo_proceso);
    request.input('direccion_id', sql.Int, projectData.direccion_id);
    request.input('vinculacion_poa', sql.NVarChar, projectData.vinculacion_poa);
    request.input('vinculacion_pac', sql.NVarChar, projectData.vinculacion_pac);
    request.input('etapa', sql.NVarChar, projectData.etapa);
    request.input('proveedor_contratista', sql.NVarChar, projectData.proveedor_contratista);
    request.input('forma_pago', sql.NVarChar, projectData.forma_pago);
    request.input('fecha_inicio', sql.Date, projectData.fecha_inicio);
    request.input('fecha_fin', sql.Date, projectData.fecha_fin);
    request.input('duracion_dias', sql.Int, projectData.duracion_dias);
    
    request.input('presupuesto_asignado', sql.Decimal(18, 2), projectData.presupuesto.presupuesto_asignado);
    request.input('certificado', sql.Decimal(18, 2), projectData.presupuesto.certificado);
    request.input('fecha_certificacion', sql.Date, projectData.presupuesto.fecha_certificacion || null);
    request.input('comprometido', sql.Decimal(18, 2), projectData.presupuesto.comprometido);
    request.input('fecha_compromiso', sql.Date, projectData.presupuesto.fecha_compromiso || null);
    request.input('devengado', sql.Decimal(18, 2), projectData.presupuesto.devengado);
    request.input('fecha_devengado', sql.Date, projectData.presupuesto.fecha_devengado || null);
    request.input('pagado', sql.Decimal(18, 2), projectData.presupuesto.pagado);
    request.input('fecha_pago', sql.Date, projectData.presupuesto.fecha_pago || null);
    
    request.input('latitud', sql.Decimal(10, 8), projectData.ubicacion ? projectData.ubicacion.lat : null);
    request.input('longitud', sql.Decimal(11, 8), projectData.ubicacion ? projectData.ubicacion.lng : null);

    const projectResult = await request.query(`
      INSERT INTO dbo.proyectos (
        nombre, codigo_proceso, direccion_id, vinculacion_poa, vinculacion_pac, etapa, proveedor_contratista, forma_pago, fecha_inicio, fecha_fin, duracion_dias,
        presupuesto_asignado, certificado, fecha_certificacion, comprometido, fecha_compromiso, devengado, fecha_devengado, pagado, fecha_pago, latitud, longitud
      )
      OUTPUT INSERTED.id
      VALUES (
        @nombre, @codigo_proceso, @direccion_id, @vinculacion_poa, @vinculacion_pac, @etapa, @proveedor_contratista, @forma_pago, @fecha_inicio, @fecha_fin, @duracion_dias,
        @presupuesto_asignado, @certificado, @fecha_certificacion, @comprometido, @fecha_compromiso, @devengado, @fecha_devengado, @pagado, @fecha_pago, @latitud, @longitud
      )
    `);

    const projectId = projectResult.recordset[0].id;

    // Insertar partidas asociadas
    for (const part of partidas) {
      const partReq = new sql.Request(transaction);
      partReq.input('proyecto_id', sql.Int, projectId);
      partReq.input('partida_codigo', sql.NVarChar, part.codigo);
      partReq.input('monto_asignado', sql.Decimal(18, 2), part.monto_asignado);
      await partReq.query(`
        INSERT INTO dbo.proyecto_partidas (proyecto_id, partida_codigo, monto_asignado)
        VALUES (@proyecto_id, @partida_codigo, @monto_asignado)
      `);
    }

    // Insertar pagos programados
    for (const pay of pagos) {
      const payReq = new sql.Request(transaction);
      payReq.input('proyecto_id', sql.Int, projectId);
      payReq.input('descripcion', sql.NVarChar, pay.descripcion);
      payReq.input('monto', sql.Decimal(18, 2), pay.monto);
      payReq.input('fecha_prevista', sql.Date, pay.fecha_prevista);
      payReq.input('fecha_real_pago', sql.Date, pay.fecha_real_pago || null);
      payReq.input('estado', sql.NVarChar, pay.estado);
      await payReq.query(`
        INSERT INTO dbo.pagos_programados (proyecto_id, descripcion, monto, fecha_prevista, fecha_real_pago, estado)
        VALUES (@proyecto_id, @descripcion, @monto, @fecha_prevista, @fecha_real_pago, @estado)
      `);
    }

    await transaction.commit();
    return projectId;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

export const update = async (id, projectData, partidas) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    // Actualizar proyecto
    const request = new sql.Request(transaction);
    request.input('id', sql.Int, id);
    request.input('nombre', sql.NVarChar, projectData.nombre);
    request.input('codigo_proceso', sql.NVarChar, projectData.codigo_proceso);
    request.input('direccion_id', sql.Int, projectData.direccion_id);
    request.input('vinculacion_poa', sql.NVarChar, projectData.vinculacion_poa);
    request.input('vinculacion_pac', sql.NVarChar, projectData.vinculacion_pac);
    request.input('etapa', sql.NVarChar, projectData.etapa);
    request.input('proveedor_contratista', sql.NVarChar, projectData.proveedor_contratista);
    request.input('forma_pago', sql.NVarChar, projectData.forma_pago);
    request.input('fecha_inicio', sql.Date, projectData.fecha_inicio);
    request.input('fecha_fin', sql.Date, projectData.fecha_fin);
    request.input('duracion_dias', sql.Int, projectData.duracion_dias);
    
    request.input('presupuesto_asignado', sql.Decimal(18, 2), projectData.presupuesto.presupuesto_asignado);
    request.input('certificado', sql.Decimal(18, 2), projectData.presupuesto.certificado);
    request.input('fecha_certificacion', sql.Date, projectData.presupuesto.fecha_certificacion || null);
    request.input('comprometido', sql.Decimal(18, 2), projectData.presupuesto.comprometido);
    request.input('fecha_compromiso', sql.Date, projectData.presupuesto.fecha_compromiso || null);
    request.input('devengado', sql.Decimal(18, 2), projectData.presupuesto.devengado);
    request.input('fecha_devengado', sql.Date, projectData.presupuesto.fecha_devengado || null);
    request.input('pagado', sql.Decimal(18, 2), projectData.presupuesto.pagado);
    request.input('fecha_pago', sql.Date, projectData.presupuesto.fecha_pago || null);

    await request.query(`
      UPDATE dbo.proyectos 
      SET 
        nombre = @nombre, 
        codigo_proceso = @codigo_proceso, 
        direccion_id = @direccion_id, 
        vinculacion_poa = @vinculacion_poa, 
        vinculacion_pac = @vinculacion_pac, 
        etapa = @etapa, 
        proveedor_contratista = @proveedor_contratista, 
        forma_pago = @forma_pago, 
        fecha_inicio = @fecha_inicio, 
        fecha_fin = @fecha_fin, 
        duracion_dias = @duracion_dias,
        presupuesto_asignado = @presupuesto_asignado, 
        certificado = @certificado, 
        fecha_certificacion = @fecha_certificacion, 
        comprometido = @comprometido, 
        fecha_compromiso = @fecha_compromiso, 
        devengado = @devengado, 
        fecha_devengado = @fecha_devengado, 
        pagado = @pagado, 
        fecha_pago = @fecha_pago
      WHERE id = @id
    `);

    // Actualizar partidas (Borrar anteriores e insertar nuevas)
    const delReq = new sql.Request(transaction);
    delReq.input('proyecto_id', sql.Int, id);
    await delReq.query('DELETE FROM dbo.proyecto_partidas WHERE proyecto_id = @proyecto_id');

    for (const part of partidas) {
      const partReq = new sql.Request(transaction);
      partReq.input('proyecto_id', sql.Int, id);
      partReq.input('partida_codigo', sql.NVarChar, part.codigo);
      partReq.input('monto_asignado', sql.Decimal(18, 2), part.monto_asignado);
      await partReq.query(`
        INSERT INTO dbo.proyecto_partidas (proyecto_id, partida_codigo, monto_asignado)
        VALUES (@proyecto_id, @partida_codigo, @monto_asignado)
      `);
    }

    await transaction.commit();
    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

export const remove = async (id) => {
  const result = await query('DELETE FROM dbo.proyectos WHERE id = @id', { id });
  return result.rowsAffected[0] > 0;
};

// Actualizar un pago programado a Pagado
export const updatePaymentStatus = async (paymentId, fechaReal, estado) => {
  const result = await query(
    `UPDATE dbo.pagos_programados 
     SET estado = @estado, fecha_real_pago = @fechaReal 
     WHERE id = @paymentId`,
    { paymentId, fechaReal, estado }
  );
  return result.rowsAffected[0] > 0;
};

// Guardar cambio de etapa en el historial
export const saveStageChange = async (projectId, etapaAnterior, etapaNueva, usuarioId, fechaCambio) => {
  await query(
    `INSERT INTO dbo.historial_etapas (proyecto_id, etapa_anterior, etapa_nueva, fecha_cambio, usuario_id)
     VALUES (@projectId, @etapaAnterior, @etapaNueva, @fechaCambio, @usuarioId)`,
    {
      projectId,
      etapaAnterior,
      etapaNueva,
      usuarioId,
      fechaCambio
    }
  );
};

// Obtener proyectos georreferenciados para el mapa
export const getProjectsMap = async () => {
  const result = await query(`
    SELECT p.id, p.nombre, p.latitud, p.longitud, p.etapa as estado, 
           p.presupuesto_asignado as presupuesto, d.nombre as direccion_nombre, 
           p.fecha_inicio, p.fecha_fin
    FROM dbo.proyectos p
    JOIN dbo.direcciones d ON p.direccion_id = d.id
    WHERE p.latitud IS NOT NULL AND p.longitud IS NOT NULL
  `);
  
  return result.recordset.map(p => ({
    id: p.id,
    nombre: p.nombre,
    latitud: Number(p.latitud),
    longitud: Number(p.longitud),
    estado: p.estado,
    presupuesto: Number(p.presupuesto),
    direccion_nombre: p.direccion_nombre,
    fecha_inicio: p.fecha_inicio instanceof Date ? p.fecha_inicio.toISOString().slice(0, 10) : p.fecha_inicio,
    fecha_fin: p.fecha_fin instanceof Date ? p.fecha_fin.toISOString().slice(0, 10) : p.fecha_fin
  }));
};

