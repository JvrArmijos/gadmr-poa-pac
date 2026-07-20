// aiService.js - Servicio de Inteligencia Artificial y Consultas GADMR
import * as projectRepository from '../repositories/projectRepository.js';
import * as commonRepository from '../repositories/commonRepository.js';
import * as reportRepository from '../repositories/reportRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import * as auditService from './auditService.js';

const SIM_DATE = '2026-06-30';

// Formateador de moneda en USD
const formatUSD = (val) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

// Función para calcular métricas globales (igual a la lógica original de db.js)
export const calculateGlobalMetrics = (filteredProjects, currentDateStr = SIM_DATE) => {
  const currentDate = new Date(currentDateStr);
  
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

// Generador de Reporte Ejecutivo IA
export const generateExecutiveReport = async (userId, tipoReporte = 'anual', anio = 2026, mes = null, semestre = null) => {
  let startDate, endDate;
  const yearNum = Number(anio || 2026);
  let periodText = '';
  let titleText = '';

  const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (tipoReporte === 'mensual') {
    const monthNum = Number(mes || 3);
    const monthName = NOMBRES_MESES[monthNum - 1] || 'Enero';
    startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    periodText = `${monthName} ${yearNum}`;
    titleText = `Reporte Mensual – ${monthName} ${yearNum}`;
  } else if (tipoReporte === 'semestral') {
    const semNum = Number(semestre || 1);
    const semName = semNum === 1 ? 'Primer Semestre' : 'Segundo Semestre';
    if (semNum === 1) {
      startDate = `${yearNum}-01-01`;
      endDate = `${yearNum}-06-30`;
    } else {
      startDate = `${yearNum}-07-01`;
      endDate = `${yearNum}-12-31`;
    }
    periodText = `${semName} ${yearNum}`;
    titleText = `Reporte Semestral – ${semName} ${yearNum}`;
  } else {
    // anual
    startDate = `${yearNum}-01-01`;
    endDate = `${yearNum}-12-31`;
    periodText = `Año ${yearNum}`;
    titleText = `Reporte Anual – ${yearNum}`;
  }

  const allProjects = await projectRepository.getAll();
  const projects = allProjects.filter(p => {
    return p.fecha_inicio <= endDate && p.fecha_fin >= startDate;
  });

  const directions = await commonRepository.getDirecciones();
  const metrics = calculateGlobalMetrics(projects, endDate);
  
  // Agrupar ejecución por dirección
  const dirExecution = {};
  directions.forEach(d => {
    dirExecution[d.id] = { nombre: d.nombre, sigla: d.sigla, total: 0, devengado: 0, proyectosCount: 0 };
  });

  projects.forEach(proj => {
    const dId = proj.direccion_id;
    if (dirExecution[dId]) {
      dirExecution[dId].total += Number(proj.presupuesto.presupuesto_asignado || 0);
      dirExecution[dId].devengado += Number(proj.presupuesto.devengado || 0);
      dirExecution[dId].proyectosCount++;
    }
  });

  let mejorDir = null;
  let peorDir = null;
  let maxPct = -1;
  let minPct = 101;

  Object.values(dirExecution).forEach(de => {
    const pct = de.total > 0 ? (de.devengado / de.total) * 100 : 0;
    de.pct = pct;
    
    if (de.total > 0) {
      if (pct > maxPct) {
        maxPct = pct;
        mejorDir = de;
      }
      if (pct < minPct) {
        minPct = pct;
        peorDir = de;
      }
    }
  });

  // Encontrar pagos vencidos
  const pagosVencidosList = [];
  projects.forEach(p => {
    if (p.pagos) {
      p.pagos.forEach(pago => {
        if (pago.estado !== 'Pagado') {
          const fp = new Date(pago.fecha_prevista);
          if (fp < new Date(endDate)) {
            const diffDays = Math.ceil(Math.abs(new Date(endDate) - fp) / (1000 * 60 * 60 * 24));
            pagosVencidosList.push({
              proyecto: p.nombre,
              codigo: p.codigo_proceso,
              monto: pago.monto,
              dias_atraso: diffDays,
              descripcion: pago.descripcion
            });
          }
        }
      });
    }
  });

  const user = await userRepository.findById(userId);
  const autorNombre = user ? user.nombre : 'Antigravity AI Engine';
  const autorRol = user ? user.role_nombre : 'Control Financiero';

  const reportText = `### ${titleText}
**Fecha de Generación:** ${nowStr()}
**Autor:** ${autorNombre}
**Rol:** ${autorRol}
**Período Consultado:** ${periodText}

---

#### 1. RESUMEN EJECUTIVO DE EJECUCIÓN GLOBAL
A la fecha de corte, el Gobierno Autónomo Descentralizado Municipal de Riobamba (GADMR) registra un presupuesto total asignado de **${formatUSD(metrics.totalPresupuesto)}** a través de **${projects.length} proyectos** monitoreados en el Plan Operativo Anual (POA) y Plan Anual de Contratación (PAC).

La ejecución presupuestaria global se sitúa en un **${metrics.pctEjecucion.toFixed(2)}%** (medido como Devengado/Presupuesto), representando un monto devengado total de **${formatUSD(metrics.totalDevengado)}**. 
*   **Certificación Presupuestaria:** Se ha certificado el **${metrics.pctCertificado.toFixed(2)}%** (${formatUSD(metrics.totalCertificado)}) del presupuesto global.
*   **Compromisos Contractuales:** Se registra un **${metrics.pctComprometido.toFixed(2)}%** comprometido (${formatUSD(metrics.totalComprometido)}), restando un saldo por comprometer de **${formatUSD(metrics.saldoComprometer)}**.
*   **Cadena de Pagos:** Del monto devengado, se ha pagado efectivamente el **${metrics.pctPagado.toFixed(2)}%** (${formatUSD(metrics.totalPagado)}), dejando un saldo pendiente de pago por devengar de **${formatUSD(metrics.saldoPagar)}**.

---

#### 2. ANÁLISIS SECTORIAL POR DIRECCIÓN DE GESTIÓN
*   **Líder de Ejecución:** La **${mejorDir ? mejorDir.nombre : 'N/D'}** presenta el mayor índice de avance presupuestario con un **${maxPct.toFixed(2)}%** de ejecución (${mejorDir ? formatUSD(mejorDir.devengado) : '$0.00'} devengados de ${mejorDir ? formatUSD(mejorDir.total) : '$0.00'} asignados).
*   **Bajo Rendimiento:** La **${peorDir ? peorDir.nombre : 'N/D'}** registra un avance crítico de apenas **${minPct.toFixed(2)}%** de ejecución. Esta área requiere intervención correctiva y seguimiento de procesos preparatorios/precontractuales.

---

#### 3. ESTADO DE ALERTAS Y ALERTAS FINANCIERAS
Se identifican **${metrics.cantPagosVencidos} pagos vencidos** en el sistema que suman un monto en mora de **${formatUSD(metrics.totalPagosVencidos)}**. El retraso promedio en pagos vencidos asciende a **${metrics.promedioAtraso} días**.

**Detalle de Obligaciones Pendientes Prioritarias:**
${pagosVencidosList.length === 0 ? 'No se registran obligaciones pendientes o pagos vencidos en este período.' : pagosVencidosList.map((p, idx) => `${idx + 1}. **${p.proyecto}** (${p.codigo})
   - Hito vencido: *${p.descripcion}*
   - Monto en Mora: **${formatUSD(p.monto)}**
   - Retraso: **${p.dias_atraso} días** (Prioridad: ${p.dias_atraso >= 28 ? 'Crítica' : p.dias_atraso >= 15 ? 'Alta' : 'Media'})`).join('\n')}

---

#### 4. RECOMENDACIONES DE LA DIRECCIÓN DE PLANIFICACIÓN
1.  **Aceleración en Procesos Precontractuales:** Existen proyectos en etapas tempranas que representan saldos importantes por comprometer. Se sugiere priorizar la adjudicación de contratos de Obras Públicas y Planificación.
2.  **Mitigación de Riesgos de Contratistas:** Para proyectos con más de 20 días de atraso en planillas (como el *Sistema de Alcantarillado en Licán* o *Equipamiento de Centros Infantiles*), se recomienda convocar a los contratistas y fiscales de obra para justificar las demoras.
3.  **Liquidez Financiera:** Disponer de los recursos necesarios para saldar los **${formatUSD(metrics.totalPagosVencidos)}** vencidos a fin de evitar demandas por incumplimiento contractual o paralizaciones de obra.`;

  const reportMetadata = {
    proyectos_evaluados: projects.length,
    ejecucion_pct: metrics.pctEjecucion,
    pagos_vencidos: metrics.cantPagosVencidos,
    monto_vencido: metrics.totalPagosVencidos,
    periodText
  };

  // Guardar en Base de Datos
  await reportRepository.saveReport({
    fecha_generacion: nowStr(),
    analisis_texto: reportText,
    metadata: JSON.stringify(reportMetadata),
    proyecto_id: null,
    direccion_id: null,
    usuario_id: userId,
    tipo_reporte: tipoReporte
  });

  // Guardar log de auditoría
  await auditService.logAudit(userId, 'Generar Reporte IA', 'reportes_ia', `Compiló el ${titleText} con Inteligencia Artificial.`);

  return {
    analisis: reportText,
    metadata: reportMetadata
  };
};

// Chatbot IA Interno (Pipeline de Extracción e Interpretación de Datos)
export const parseChatbotQuery = async (query, userId) => {
  const projects = await projectRepository.getAll();
  const directions = await commonRepository.getDirecciones();

  const cleanQuery = query.toLowerCase().trim();
  const metrics = calculateGlobalMetrics(projects, SIM_DATE);

  let response = '';

  // 1. Intent: Pagos Vencidos / Atrasos
  if (cleanQuery === '1' || cleanQuery.includes('vencid') || cleanQuery.includes('atras') || cleanQuery.includes('mora') || cleanQuery.includes('retraso')) {
    const pagosVencidos = [];
    projects.forEach(p => {
      if (p.pagos) {
        p.pagos.forEach(pago => {
          if (pago.estado !== 'Pagado') {
            const fp = new Date(pago.fecha_prevista);
            if (fp < new Date(SIM_DATE)) {
              const diffDays = Math.ceil(Math.abs(new Date(SIM_DATE) - fp) / (1000 * 60 * 60 * 24));
              pagosVencidos.push({
                proyecto: p.nombre,
                contratista: p.proveedor_contratista || 'Por adjudicar',
                monto: pago.monto,
                dias: diffDays,
                descripcion: pago.descripcion
              });
            }
          }
        });
      }
    });

    if (pagosVencidos.length === 0) {
      response = `¡Excelente noticia! Al corte del **${SIM_DATE}**, el sistema **no registra pagos vencidos**.`;
    } else {
      response = `He consultado el sistema y encontré **${pagosVencidos.length} pagos vencidos** que requieren atención inmediata:\n\n`;
      pagosVencidos.forEach((p, idx) => {
        response += `*   **${idx + 1}. ${p.proyecto}**\n`;
        response += `    - Detalle: *${p.descripcion}*\n`;
        response += `    - Monto pendiente: **${formatUSD(p.monto)}**\n`;
        response += `    - Contratista: *${p.contratista}*\n`;
        response += `    - Días de retraso: **${p.dias} días** (${p.dias >= 28 ? '🔴 Prioridad Crítica' : '🟡 Prioridad Alta'})\n\n`;
      });
      response += `El monto total acumulado por pagar en mora es de **${formatUSD(metrics.totalPagosVencidos)}**. ¿Deseas que genere una alerta formal a tesorería para alguno de ellos?`;
    }
  }
  // 2. Intent: Mejor Ejecución Presupuestaria
  else if (cleanQuery === '2' || cleanQuery.includes('mejor') || cleanQuery.includes('lider') || cleanQuery.includes('máximo') || cleanQuery.includes('maximo') || cleanQuery.includes('mayor ejecu')) {
    const dirExecution = {};
    directions.forEach(d => {
      dirExecution[d.id] = { nombre: d.nombre, total: 0, devengado: 0 };
    });
    projects.forEach(p => {
      const dId = p.direccion_id;
      if (dirExecution[dId]) {
        dirExecution[dId].total += p.presupuesto.presupuesto_asignado || 0;
        dirExecution[dId].devengado += p.presupuesto.devengado || 0;
      }
    });

    let mejor = null;
    let maxPct = -1;
    Object.values(dirExecution).forEach(de => {
      const pct = de.total > 0 ? (de.devengado / de.total) * 100 : 0;
      if (de.total > 0 && pct > maxPct) {
        maxPct = pct;
        mejor = de;
      }
    });

    if (mejor) {
      response = `La dirección con **mejor ejecución presupuestaria** es la **${mejor.nombre}**, alcanzando un índice de ejecución del **${maxPct.toFixed(2)}%** (con **${formatUSD(mejor.devengado)}** devengados de un total asignado de **${formatUSD(mejor.total)}**).`;
    } else {
      response = 'No se registran datos suficientes para determinar la mejor dirección.';
    }
  }
  // 3. Intent: Peor Ejecución o Dirección con Retrasos
  else if (cleanQuery === '3' || cleanQuery.includes('peor') || cleanQuery.includes('bajo') || cleanQuery.includes('retrasad') || cleanQuery.includes('menor ejecu')) {
    const dirExecution = {};
    directions.forEach(d => {
      dirExecution[d.id] = { nombre: d.nombre, total: 0, devengado: 0 };
    });
    projects.forEach(p => {
      const dId = p.direccion_id;
      if (dirExecution[dId]) {
        dirExecution[dId].total += p.presupuesto.presupuesto_asignado || 0;
        dirExecution[dId].devengado += p.presupuesto.devengado || 0;
      }
    });

    let peor = null;
    let minPct = 101;
    Object.values(dirExecution).forEach(de => {
      const pct = de.total > 0 ? (de.devengado / de.total) * 100 : 0;
      if (de.total > 0 && pct < minPct) {
        minPct = pct;
        peor = de;
      }
    });

    if (peor) {
      response = `La dirección con **menor avance en ejecución presupuestaria** es la **${peor.nombre}**, registrando un nivel de ejecución del **${minPct.toFixed(2)}%** (con **${formatUSD(peor.devengado)}** devengados de un total asignado de **${formatUSD(peor.total)}**). Se sugiere revisar sus procesos contractuales pendientes.`;
    } else {
      response = 'No se registran datos suficientes para determinar el rendimiento.';
    }
  }
  // 4. Intent: Montos por pagar o saldos pendientes
  else if (cleanQuery.includes('falta por pagar') || cleanQuery.includes('saldo por pagar') || cleanQuery.includes('por pagar') || cleanQuery.includes('pendiente de pago')) {
    response = `De acuerdo con la cadena presupuestaria analizada:
*   Monto total devengado: **${formatUSD(metrics.totalDevengado)}**
*   Monto pagado efectivo: **${formatUSD(metrics.totalPagado)}**
*   **Saldo pendiente por pagar (Devengado - Pagado): ${formatUSD(metrics.saldoPagar)}**

Adicionalmente, restan **${formatUSD(metrics.saldoComprometer)}** por comprometer de la partida presupuestaria global.`;
  }
  // 5. Intent: Proyectos en Riesgo
  else if (cleanQuery.includes('riesgo') || cleanQuery.includes('peligro') || cleanQuery.includes('alerta') || cleanQuery.includes('crítico')) {
    const enRiesgo = [];
    projects.forEach(p => {
      let scoreRiesgo = 0;
      let causas = [];

      // Evaluar retraso de pagos
      let pagosVencidosCount = 0;
      if (p.pagos) {
        p.pagos.forEach(pago => {
          if (pago.estado !== 'Pagado') {
            const fp = new Date(pago.fecha_prevista);
            if (fp < new Date(SIM_DATE)) {
              pagosVencidosCount++;
            }
          }
        });
      }
      if (pagosVencidosCount > 0) {
        scoreRiesgo += 40;
        causas.push(`Tiene ${pagosVencidosCount} pagos vencidos`);
      }

      // Evaluar ejecución baja en etapa de ejecución
      if (p.etapa === 'Ejecución') {
        const pctExec = p.presupuesto.presupuesto_asignado > 0 ? (p.presupuesto.devengado / p.presupuesto.presupuesto_asignado) * 100 : 0;
        if (pctExec < 30) {
          scoreRiesgo += 30;
          causas.push(`Baja ejecución presupuestaria (${pctExec.toFixed(1)}%) en fase de ejecución`);
        }
      }

      // Evaluar si está cerca de fecha fin y no está en Cierre o Ejecución avanzada
      const fechaFin = new Date(p.fecha_fin);
      const simulationDate = new Date(SIM_DATE);
      if (fechaFin < simulationDate && p.etapa !== 'Cierre') {
        scoreRiesgo += 50;
        causas.push(`Fecha contractual finalizada (${p.fecha_fin}) y proyecto no cerrado (Etapa actual: ${p.etapa})`);
      }

      if (scoreRiesgo >= 30) {
        enRiesgo.push({
          nombre: p.nombre,
          codigo: p.codigo_proceso,
          score: scoreRiesgo,
          causas: causas.join(', ')
        });
      }
    });

    if (enRiesgo.length === 0) {
      response = 'No he detectado proyectos con perfiles de riesgo significativos al momento. ¡Buen trabajo en la planificación!';
    } else {
      response = `He identificando **${enRiesgo.length} proyectos con perfiles de riesgo** basados en fechas, hitos de pago vencidos y porcentajes de avance:\n\n`;
      enRiesgo.sort((a,b) => b.score - a.score).forEach((r, idx) => {
        let badge = r.score >= 70 ? '🔴 Nivel Alto' : '🟡 Nivel Medio';
        response += `*   **${idx + 1}. ${r.nombre}** (${r.codigo})\n`;
        response += `    - Indicador de Riesgo: **${badge}** (Score: ${r.score}/100)\n`;
        response += `    - Causas: *${r.causas}*\n\n`;
      });
    }
  }
  // 6. Intent: Búsqueda específica por dirección (Obras Públicas, Movilidad, etc.)
  else if (cleanQuery.includes('obras p') || cleanQuery.includes('obras pùblicas') || cleanQuery.includes('obras publicas') || cleanQuery.includes('infraestructura')) {
    const opProjects = projects.filter(p => p.direccion_id === 1);
    if (opProjects.length > 0) {
      const opMetrics = calculateGlobalMetrics(opProjects, SIM_DATE);
      const maxProj = opProjects.reduce((prev, current) => (prev.presupuesto.presupuesto_asignado > current.presupuesto.presupuesto_asignado) ? prev : current);
      response = `**Resumen de la Dirección de Obras Públicas (OP):**
*   Proyectos asignados: **${opProjects.length}**
*   Presupuesto Total: **${formatUSD(opMetrics.totalPresupuesto)}**
*   Monto Devengado: **${formatUSD(opMetrics.totalDevengado)}**
*   Avance de Ejecución: **${opMetrics.pctEjecucion.toFixed(2)}%**
*   Pagos Vencidos: **${opMetrics.cantPagosVencidos}** (Monto: ${formatUSD(opMetrics.totalPagosVencidos)})

El proyecto de mayor envergadura en ejecución es: *${maxProj.nombre}*.`;
    } else {
      response = 'No se registran proyectos para la Dirección de Obras Públicas.';
    }
  }
  // Respuesta por defecto
  else {
    response = `¡Hola! Soy el asistente analítico de IA del GADMR. Puedo ayudarte a consultar información financiera en tiempo real extraída directamente de la base de datos local.

Prueba preguntándome:
1.  *¿Qué proyectos tienen pagos vencidos o en mora?*
2.  *¿Cuál dirección tiene la mejor ejecución presupuestaria?*
3.  *¿Cuánto dinero falta por pagar en total (devengado vs pagado)?*
4.  *Muéstrame proyectos en riesgo y sus causas.*
5.  *¿Cómo va la ejecución presupuestaria en Obras Públicas?*`;
  }

  // Guardar log de auditoría del chatbot
  await auditService.logAudit(
    userId,
    'Consulta Chatbot IA',
    'reportes_ia',
    `Preguntó al chatbot: "${query.substring(0, 40)}..."`
  );

  return response;
};

// Helper para fecha formateada actual
const nowStr = () => {
  const now = new Date();
  const formatDigit = (n) => (n < 10 ? '0' + n : n);
  return `${now.getFullYear()}-${formatDigit(now.getMonth() + 1)}-${formatDigit(now.getDate())} ${formatDigit(now.getHours())}:${formatDigit(now.getMinutes())}:${formatDigit(now.getSeconds())}`;
};
