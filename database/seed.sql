-- seed.sql - Datos de Semilla Iniciales para GADMR POA/PAC
-- Limpiar datos existentes en orden inverso de dependencias
DELETE FROM dbo.audit_logs;
DELETE FROM dbo.reportes_ia;
DELETE FROM dbo.historial_etapas;
DELETE FROM dbo.pagos_programados;
DELETE FROM dbo.proyecto_partidas;
DELETE FROM dbo.proyectos;
DBCC CHECKIDENT ('dbo.proyectos', RESEED, 0);
DELETE FROM dbo.partidas_presupuestarias;
DELETE FROM dbo.usuarios;
DBCC CHECKIDENT ('dbo.usuarios', RESEED, 0);
DELETE FROM dbo.direcciones;
DELETE FROM dbo.roles;

-- 1. Insertar Roles
INSERT INTO dbo.roles (id, nombre, descripcion) VALUES
(1, 'Máxima autoridad / Alcaldía', 'Vista global y reportes ejecutivos IA'),
(2, 'Director/a de Gestión', 'Control de avances, presupuesto y pagos de sus proyectos'),
(3, 'Dirección Financiera', 'Ejecución presupuestaria global (Certificado, Comprometido, Devengado, Pagado)'),
(4, 'Administrador', 'Acceso total y configuración de seguridad');

-- 2. Insertar Direcciones
INSERT INTO dbo.direcciones (id, nombre, sigla, objetivos) VALUES
(1, 'Dirección de Obras Públicas', 'OP', '["Mejorar la infraestructura vial", "Expandir el sistema de alcantarillado", "Mantener los espacios públicos"]'),
(2, 'Dirección de Movilidad y Tránsito', 'MT', '["Optimizar la semaforización y señalética", "Control operativo de tránsito seguro", "Planificación de movilidad sostenible"]'),
(3, 'Dirección de Desarrollo Social', 'DS', '["Garantizar la atención a grupos vulnerables", "Promover la cultura y el deporte", "Fortalecer los centros de cuidado"]'),
(4, 'Dirección de Planificación y Proyectos', 'PL', '["Actualizar el PDOT y catastros", "Diseñar estrategias de desarrollo urbano", "Gestionar cooperación institucional"]');

-- 3. Insertar Usuarios (Password por defecto: Password123)
-- Hash bcrypt de "Password123": $2a$12$D4L8gDEXqT0rI60Zc6QhMOfmG721XWl/2F5d8V9s3pW2K7o0v9VnK
INSERT INTO dbo.usuarios (nombre, email, password_hash, role_id, direccion_id) VALUES
('Dr. John Vinueza (Alcalde)', 'alcalde@riobamba.gob.ec', '$2a$12$D4L8gDEXqT0rI60Zc6QhMOfmG721XWl/2F5d8V9s3pW2K7o0v9VnK', 1, NULL),
('Arq. Sofía Torres', 'director.op@riobamba.gob.ec', '$2a$12$D4L8gDEXqT0rI60Zc6QhMOfmG721XWl/2F5d8V9s3pW2K7o0v9VnK', 2, 1),
('Lic. Roberto Pazmiño', 'finanzas@riobamba.gob.ec', '$2a$12$D4L8gDEXqT0rI60Zc6QhMOfmG721XWl/2F5d8V9s3pW2K7o0v9VnK', 3, NULL),
('Ing. Carlos Mendoza', 'admin@riobamba.gob.ec', '$2a$12$D4L8gDEXqT0rI60Zc6QhMOfmG721XWl/2F5d8V9s3pW2K7o0v9VnK', 4, NULL);

-- 4. Insertar Partidas Presupuestarias
INSERT INTO dbo.partidas_presupuestarias (codigo, denominacion) VALUES
('73.06.06.2026.1.8.008.000.011.200.001', 'Estudios y Diseños de Proyectos Viales'),
('75.01.05.2026.1.8.008.000.011.200.002', 'Construcción y Pavimentación de Calles'),
('73.08.12.2026.2.4.010.000.012.300.003', 'Adquisición de Equipos Semafóricos'),
('73.06.05.2026.1.8.008.000.011.200.004', 'Señalización Vial Integral'),
('84.01.03.2026.3.1.015.000.013.100.005', 'Adquisición de Vehículos de Control'),
('73.02.04.2026.2.2.012.000.014.200.006', 'Equipamiento de Centros Sociales'),
('73.02.35.2026.2.2.012.000.014.200.007', 'Servicio de Alimentación y Nutrición'),
('73.06.01.2026.1.1.002.000.015.100.008', 'Consultoría y Catastro Multifinalitario'),
('73.06.02.2026.1.1.002.000.015.100.009', 'Planificación Territorial y PDOT'),
('73.08.11.2026.1.1.002.000.015.100.010', 'Adquisición de Servidores y TICs');

-- SET IDENTITY_INSERT para insertar IDs explícitos en Proyectos (para mantener coherencia histórica)
SET IDENTITY_INSERT dbo.proyectos ON;

-- 5. Insertar Proyectos
INSERT INTO dbo.proyectos (id, nombre, codigo_proceso, direccion_id, vinculacion_poa, vinculacion_pac, etapa, proveedor_contratista, forma_pago, fecha_inicio, fecha_fin, duracion_dias, presupuesto_asignado, certificado, fecha_certificacion, comprometido, fecha_compromiso, devengado, fecha_devengado, pagado, fecha_pago, latitud, longitud) VALUES
(1, 'Asfaltado y Obras Complementarias de la Av. Lizarzaburu (Tramo Norte)', 'MCO-GADMR-001-2026', 1, 'Objetivo Estratégico 1: Infraestructura Sostenible', 'Item PAC 245 - Pavimentación Urbana', 'Ejecución', 'Consorcio Vial Chimborazo', 'Pagos parciales', '2026-01-15', '2026-08-15', 212, 850000.00, 850000.00, '2026-01-20', 800000.00, '2026-02-10', 450000.00, '2026-05-15', 400000.00, '2026-05-20', -1.6595, -78.6470),
(2, 'Construcción del Sistema de Alcantarillado Sanitario en la Parroquia Licán', 'LICO-GADMR-002-2026', 1, 'Objetivo Estratégico 2: Saneamiento Básico', 'Item PAC 109 - Alcantarillado Rural', 'Ejecución', 'Ing. Patricio Silva', 'Pagos parciales', '2026-02-10', '2026-09-10', 212, 320000.00, 320000.00, '2026-02-15', 320000.00, '2026-03-01', 180000.00, '2026-05-30', 100000.00, '2026-06-05', -1.6500, -78.6800),
(3, 'Regeneración Urbana del Parque Infantil de Riobamba (Guayaquil y Av. Unidad Nacional)', 'LICO-GADMR-003-2026', 1, 'Objetivo Estratégico 3: Espacios Públicos y Áreas Verdes', 'Item PAC 098 - Parques y Jardines', 'Contractual', 'Constructora RioVerde S.A.', 'Con anticipo', '2026-07-01', '2026-12-01', 153, 450000.00, 450000.00, '2026-05-12', 400000.00, '2026-06-20', 0.00, NULL, 0.00, NULL, -1.6705, -78.6495),
(4, 'Mantenimiento Vial de Calles del Centro Histórico (Riobamba)', 'SIE-GADMR-004-2026', 1, 'Objetivo Estratégico 1: Infraestructura Sostenible', 'Item PAC 112 - Mantenimiento Vial', 'Preparatoria', '', 'Contra entrega', '2026-09-01', '2026-11-30', 90, 200000.00, 0.00, NULL, 0.00, NULL, 0.00, NULL, 0.00, NULL, -1.6720, -78.6500),
(5, 'Adquisición e Instalación de Semáforos Inteligentes - Fase 2', 'LICA-GADMR-005-2026', 2, 'Objetivo Estratégico 4: Movilidad Segura y Ordenada', 'Item PAC 302 - Dispositivos Tecnológicos de Tránsito', 'Ejecución', 'TecnoTránsito Ecuador S.A.', 'Pagos mensuales', '2026-02-01', '2026-08-30', 210, 180000.00, 180000.00, '2026-01-28', 180000.00, '2026-02-05', 120000.00, '2026-06-01', 120000.00, '2026-06-05', -1.6669, -78.6471),
(6, 'Señalización Vial Horizontal y Vertical de la Av. Canónigo Ramos', 'MCO-GADMR-006-2026', 2, 'Objetivo Estratégico 4: Movilidad Segura y Ordenada', 'Item PAC 304 - Señalización Vial', 'Precontractual', '', 'Contra entrega', '2026-08-01', '2026-09-30', 60, 75000.00, 75000.00, '2026-06-15', 0.00, NULL, 0.00, NULL, 0.00, NULL, NULL, NULL),
(7, 'Compra de Camionetas para Control Operativo de Tránsito', 'LICA-GADMR-007-2026', 2, 'Objetivo Estratégico 4: Movilidad Segura y Ordenada', 'Item PAC 015 - Vehículos Municipales', 'Contractual', 'Toyocosta S.A.', 'Sin anticipo', '2026-06-10', '2026-09-10', 92, 120000.00, 120000.00, '2026-05-02', 120000.00, '2026-06-08', 0.00, NULL, 0.00, NULL, NULL, NULL),
(8, 'Equipamiento de Centros de Desarrollo Infantil del GADMR (Kits lúdicos e insumos)', 'SIE-GADMR-008-2026', 3, 'Objetivo Estratégico 5: Atención a Grupos Vulnerables', 'Item PAC 410 - Equipamiento Infantil', 'Ejecución', 'Distribuidora Universal', 'Pagos parciales', '2026-03-01', '2026-07-30', 151, 90000.00, 90000.00, '2026-02-20', 85000.00, '2026-02-28', 85000.00, '2026-05-05', 50000.00, '2026-05-10', -1.6790, -78.6540),
(9, 'Programa Emergente de Nutrición Infantil y Entrega de Kits Alimenticios', 'SIE-GADMR-009-2026', 3, 'Objetivo Estratégico 5: Atención a Grupos Vulnerables', 'Item PAC 412 - Nutrición y Alimentación', 'Cierre', 'Proalimentos del Ecuador S.A.', 'Contra entrega', '2026-01-10', '2026-05-10', 120, 60000.00, 60000.00, '2026-01-05', 60000.00, '2026-01-10', 60000.00, '2026-05-02', 60000.00, '2026-05-10', NULL, NULL),
(10, 'Implementación de Talleres Culturales y Artísticos Barriales (Proyecto Identidad)', 'RE-GADMR-010-2026', 3, 'Objetivo Estratégico 6: Cohesión Social e Identidad', 'Item PAC 511 - Talleres Educativos', 'Preparatoria', '', 'Contra entrega', '2026-08-15', '2026-11-15', 92, 35000.00, 5000.00, '2026-06-20', 0.00, NULL, 0.00, NULL, 0.00, NULL, NULL, NULL),
(11, 'Proyecto de Fortalecimiento del Catastro Predial Multifinalitario de Riobamba', 'LICO-GADMR-011-2026', 4, 'Objetivo Estratégico 7: Planificación y Gestión del Suelo', 'Item PAC 040 - Consultorías e Información', 'Ejecución', 'Sistemas Geográficos Geocarta Cía. Ltda.', 'Pagos parciales', '2026-02-15', '2026-09-15', 212, 250000.00, 250000.00, '2026-02-10', 230000.00, '2026-02-25', 160000.00, '2026-05-20', 90000.00, '2026-05-25', -1.6600, -78.6310),
(12, 'Actualización del Plan de Desarrollo y Ordenamiento Territorial (PDOT) Riobamba 2030', 'LICO-GADMR-012-2026', 4, 'Objetivo Estratégico 7: Planificación y Gestión del Suelo', 'Item PAC 042 - Consultorías e Información', 'Contractual', 'Asociación Planifica Riobamba', 'Pagos parciales', '2026-06-15', '2026-12-15', 183, 110000.00, 110000.00, '2026-05-10', 110000.00, '2026-06-10', 0.00, NULL, 0.00, NULL, NULL, NULL),
(13, 'Adquisición de Servidores y Almacenamiento de Datos para la Dirección de TICs', 'LICA-GADMR-013-2026', 4, 'Objetivo Estratégico 8: Modernización Municipal', 'Item PAC 090 - Equipamiento Tecnológico', 'Precontractual', '', 'Sin anticipo', '2026-08-01', '2026-11-01', 92, 140000.00, 140000.00, '2026-06-01', 0.00, NULL, 0.00, NULL, 0.00, NULL, NULL, NULL),
(14, 'Modernización y Digitalización de Trámites Municipales (Gobernabilidad por Resultados)', 'SIE-GADMR-014-2026', 4, 'Objetivo Estratégico 8: Modernización Municipal', 'Item PAC 091 - Desarrollo de Software', 'Ejecución', 'Ecuasoft Cía. Ltda.', 'Pagos mensuales', '2026-03-01', '2026-09-01', 184, 80000.00, 80000.00, '2026-02-20', 80000.00, '2026-02-28', 40000.00, '2026-05-20', 40000.00, '2026-05-25', -1.6750, -78.6400),
(15, 'Construcción del Paso Elevado de la Av. de la Prensa y Av. Circunvalación', 'LICO-GADMR-015-2026', 1, 'Objetivo Estratégico 1: Infraestructura Sostenible', 'Item PAC 100 - Puentes e Intersecciones', 'Precontractual', '', 'Con anticipo', '2026-10-01', '2027-06-01', 243, 1200000.00, 1200000.00, '2026-06-05', 0.00, NULL, 0.00, NULL, 0.00, NULL, NULL, NULL);

SET IDENTITY_INSERT dbo.proyectos OFF;

-- 6. Insertar Relaciones de Partidas (proyecto_partidas)
INSERT INTO dbo.proyecto_partidas (proyecto_id, partida_codigo, monto_asignado) VALUES
(1, '75.01.05.2026.1.8.008.000.011.200.002', 850000.00),
(2, '75.01.05.2026.1.8.008.000.011.200.002', 320000.00),
(3, '75.01.05.2026.1.8.008.000.011.200.002', 450000.00),
(4, '75.01.05.2026.1.8.008.000.011.200.002', 200000.00),
(5, '73.08.12.2026.2.4.010.000.012.300.003', 180000.00),
(6, '73.06.05.2026.1.8.008.000.011.200.004', 75000.00),
(7, '84.01.03.2026.3.1.015.000.013.100.005', 120000.00),
(8, '73.02.04.2026.2.2.012.000.014.200.006', 90000.00),
(9, '73.02.35.2026.2.2.012.000.014.200.007', 60000.00),
(10, '73.02.04.2026.2.2.012.000.014.200.006', 35000.00),
(11, '73.06.01.2026.1.1.002.000.015.100.008', 250000.00),
(12, '73.06.02.2026.1.1.002.000.015.100.009', 110000.00),
(13, '73.08.11.2026.1.1.002.000.015.100.010', 140000.00),
(14, '73.08.11.2026.1.1.002.000.015.100.010', 80000.00),
(15, '75.01.05.2026.1.8.008.000.011.200.002', 1200000.00);

-- 7. Insertar Pagos Programados / Hitos
INSERT INTO dbo.pagos_programados (proyecto_id, descripcion, monto, fecha_prevista, fecha_real_pago, estado) VALUES
(1, 'Anticipo del 30%', 240000.00, '2026-02-15', '2026-02-20', 'Pagado'),
(1, 'Planilla de Avance N° 1', 160000.00, '2026-05-10', '2026-05-20', 'Pagado'),
(1, 'Planilla de Avance N° 2', 200000.00, '2026-07-15', NULL, 'Programado'),
(2, 'Anticipo de Obra', 100000.00, '2026-03-10', '2026-03-12', 'Pagado'),
(2, 'Planilla de Avance N° 1', 80000.00, '2026-06-12', NULL, 'Vencido'),
(2, 'Planilla de Avance N° 2', 100000.00, '2026-08-10', NULL, 'Programado'),
(3, 'Anticipo Contractual 40%', 160000.00, '2026-07-10', NULL, 'Programado'),
(5, 'Primer Hito de Entrega', 60000.00, '2026-03-30', '2026-03-31', 'Pagado'),
(5, 'Segundo Hito de Entrega', 60000.00, '2026-06-01', '2026-06-05', 'Pagado'),
(5, 'Hito Final y Liquidación', 60000.00, '2026-08-25', NULL, 'Programado'),
(7, 'Pago Único Contra Entrega', 120000.00, '2026-09-15', NULL, 'Programado'),
(8, 'Primer Pago (Entregable 1)', 50000.00, '2026-05-01', '2026-05-10', 'Pagado'),
(8, 'Segundo Pago (Entregable 2)', 35000.00, '2026-06-10', NULL, 'Vencido'),
(9, 'Liquidación y Pago Único', 60000.00, '2026-05-05', '2026-05-10', 'Pagado'),
(11, 'Anticipo de Consultoría 40%', 90000.00, '2026-03-01', '2026-03-05', 'Pagado'),
(11, 'Entregable N° 1 - Catastro Zonal', 70000.00, '2026-06-01', NULL, 'Vencido'),
(11, 'Entregable N° 2 - Sistema Cartográfico', 70000.00, '2026-09-01', NULL, 'Programado'),
(12, 'Planilla de Diagnóstico', 40000.00, '2026-08-01', NULL, 'Programado'),
(14, 'Entregable N° 1 - Planificación', 20000.00, '2026-04-10', '2026-04-12', 'Pagado'),
(14, 'Entregable N° 2 - Core de Trámites', 20000.00, '2026-05-20', '2026-05-25', 'Pagado'),
(14, 'Entregable N° 3 - Pruebas', 20000.00, '2026-07-20', NULL, 'Programado');

-- 8. Insertar Historial de Cambios de Etapa
INSERT INTO dbo.historial_etapas (proyecto_id, etapa_anterior, etapa_nueva, fecha_cambio, usuario_id) VALUES
(1, 'Preparatoria', 'Precontractual', '2026-01-05 09:30:00', 1),
(1, 'Precontractual', 'Contractual', '2026-01-10 11:20:00', 1),
(1, 'Contractual', 'Ejecución', '2026-01-15 15:45:00', 1),
(2, 'Contractual', 'Ejecución', '2026-02-10 10:00:00', 1),
(5, 'Contractual', 'Ejecución', '2026-02-01 16:30:00', 1),
(8, 'Contractual', 'Ejecución', '2026-03-01 09:00:00', 1),
(9, 'Ejecución', 'Cierre', '2026-05-10 17:00:00', 1),
(11, 'Contractual', 'Ejecución', '2026-02-15 10:00:00', 1),
(14, 'Contractual', 'Ejecución', '2026-03-01 09:30:00', 1);

-- 9. Insertar Logs de Auditoría Iniciales
INSERT INTO dbo.audit_logs (usuario_id, accion, tabla_afectada, detalles, fecha) VALUES
(1, 'Inicio de Sesión', 'usuarios', 'El usuario Dr. John Vinueza inició sesión como Alcalde.', '2026-06-30 08:30:00'),
(1, 'Inicialización del Sistema', 'general', 'Inicialización del sistema con base de datos de 15 proyectos POA/PAC.', '2026-06-30 08:31:00');
