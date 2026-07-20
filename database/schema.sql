-- schema.sql - Esquema de Base de Datos para GADMR POA/PAC en Microsoft SQL Server

-- Eliminar tablas si existen en orden inverso de claves foráneas
IF OBJECT_ID('dbo.audit_logs', 'U') IS NOT NULL DROP TABLE dbo.audit_logs;
IF OBJECT_ID('dbo.reportes_ia', 'U') IS NOT NULL DROP TABLE dbo.reportes_ia;
IF OBJECT_ID('dbo.historial_etapas', 'U') IS NOT NULL DROP TABLE dbo.historial_etapas;
IF OBJECT_ID('dbo.pagos_programados', 'U') IS NOT NULL DROP TABLE dbo.pagos_programados;
IF OBJECT_ID('dbo.proyecto_partidas', 'U') IS NOT NULL DROP TABLE dbo.proyecto_partidas;
IF OBJECT_ID('dbo.proyectos', 'U') IS NOT NULL DROP TABLE dbo.proyectos;
IF OBJECT_ID('dbo.partidas_presupuestarias', 'U') IS NOT NULL DROP TABLE dbo.partidas_presupuestarias;
IF OBJECT_ID('dbo.usuarios', 'U') IS NOT NULL DROP TABLE dbo.usuarios;
IF OBJECT_ID('dbo.direcciones', 'U') IS NOT NULL DROP TABLE dbo.direcciones;
IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL DROP TABLE dbo.roles;

-- 1. Tabla de Roles
CREATE TABLE dbo.roles (
    id INT PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(255) NULL
);

-- 2. Tabla de Direcciones
CREATE TABLE dbo.direcciones (
    id INT PRIMARY KEY,
    nombre NVARCHAR(150) NOT NULL,
    sigla NVARCHAR(10) NOT NULL,
    objetivos NVARCHAR(MAX) NULL -- JSON Array con objetivos
);

-- 3. Tabla de Usuarios
CREATE TABLE dbo.usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(150) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    direccion_id INT NULL,
    refresh_token NVARCHAR(500) NULL,
    refresh_token_expira DATETIME NULL,
    CONSTRAINT FK_usuarios_roles FOREIGN KEY (role_id) REFERENCES dbo.roles(id),
    CONSTRAINT FK_usuarios_direcciones FOREIGN KEY (direccion_id) REFERENCES dbo.direcciones(id)
);

-- 4. Tabla de Partidas Presupuestarias
CREATE TABLE dbo.partidas_presupuestarias (
    codigo NVARCHAR(100) PRIMARY KEY,
    denominacion NVARCHAR(255) NOT NULL
);

-- 5. Tabla de Proyectos
CREATE TABLE dbo.proyectos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL,
    codigo_proceso NVARCHAR(100) NOT NULL UNIQUE,
    direccion_id INT NOT NULL,
    vinculacion_poa NVARCHAR(255) NOT NULL,
    vinculacion_pac NVARCHAR(255) NOT NULL,
    etapa NVARCHAR(50) NOT NULL CONSTRAINT DF_proyectos_etapa DEFAULT 'Preparatoria', -- Preparatoria, Precontractual, Contractual, Ejecución, Cierre
    proveedor_contratista NVARCHAR(255) NULL,
    forma_pago NVARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    duracion_dias INT NOT NULL,
    
    -- Cadena del Gasto
    presupuesto_asignado DECIMAL(18,2) NOT NULL,
    certificado DECIMAL(18,2) NOT NULL DEFAULT 0,
    fecha_certificacion DATE NULL,
    comprometido DECIMAL(18,2) NOT NULL DEFAULT 0,
    fecha_compromiso DATE NULL,
    devengado DECIMAL(18,2) NOT NULL DEFAULT 0,
    fecha_devengado DATE NULL,
    pagado DECIMAL(18,2) NOT NULL DEFAULT 0,
    fecha_pago DATE NULL,
    
    -- Ubicación Geográfica
    latitud DECIMAL(10,8) NULL,
    longitud DECIMAL(11,8) NULL,
    
    CONSTRAINT FK_proyectos_direcciones FOREIGN KEY (direccion_id) REFERENCES dbo.direcciones(id)
);

-- 6. Tabla Intermedia Proyecto - Partidas
CREATE TABLE dbo.proyecto_partidas (
    proyecto_id INT NOT NULL,
    partida_codigo NVARCHAR(100) NOT NULL,
    monto_asignado DECIMAL(18,2) NOT NULL,
    PRIMARY KEY (proyecto_id, partida_codigo),
    CONSTRAINT FK_proyecto_partidas_proyectos FOREIGN KEY (proyecto_id) REFERENCES dbo.proyectos(id) ON DELETE CASCADE,
    CONSTRAINT FK_proyecto_partidas_partidas FOREIGN KEY (partida_codigo) REFERENCES dbo.partidas_presupuestarias(codigo)
);

-- 7. Tabla de Pagos Programados / Hitos
CREATE TABLE dbo.pagos_programados (
    id INT IDENTITY(1,1) PRIMARY KEY,
    proyecto_id INT NOT NULL,
    descripcion NVARCHAR(255) NOT NULL,
    monto DECIMAL(18,2) NOT NULL,
    fecha_prevista DATE NOT NULL,
    fecha_real_pago DATE NULL,
    estado NVARCHAR(50) NOT NULL CONSTRAINT DF_pagos_estado DEFAULT 'Programado', -- Programado, Pagado, Vencido
    CONSTRAINT FK_pagos_proyectos FOREIGN KEY (proyecto_id) REFERENCES dbo.proyectos(id) ON DELETE CASCADE
);

-- 8. Tabla Historial de Cambios de Etapa
CREATE TABLE dbo.historial_etapas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    proyecto_id INT NOT NULL,
    etapa_anterior NVARCHAR(50) NOT NULL,
    etapa_nueva NVARCHAR(50) NOT NULL,
    fecha_cambio DATETIME NOT NULL CONSTRAINT DF_historial_fecha DEFAULT GETDATE(),
    usuario_id INT NOT NULL,
    CONSTRAINT FK_historial_proyectos FOREIGN KEY (proyecto_id) REFERENCES dbo.proyectos(id) ON DELETE CASCADE,
    CONSTRAINT FK_historial_usuarios FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id)
);

-- 9. Tabla de Reportes IA
CREATE TABLE dbo.reportes_ia (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fecha_generacion DATETIME NOT NULL CONSTRAINT DF_reportes_fecha DEFAULT GETDATE(),
    analisis_texto NVARCHAR(MAX) NOT NULL,
    metadata NVARCHAR(MAX) NULL, -- JSON String
    proyecto_id INT NULL,
    direccion_id INT NULL,
    usuario_id INT NOT NULL,
    tipo_reporte NVARCHAR(50) NOT NULL CONSTRAINT DF_reportes_tipo DEFAULT 'global', -- global, direccion, proyecto
    CONSTRAINT FK_reportes_usuarios FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id)
);

-- 10. Tabla de Logs de Auditoría
CREATE TABLE dbo.audit_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NULL,
    accion NVARCHAR(150) NOT NULL,
    tabla_afectada NVARCHAR(100) NOT NULL,
    detalles NVARCHAR(MAX) NULL,
    fecha DATETIME NOT NULL CONSTRAINT DF_audit_fecha DEFAULT GETDATE()
);

-- Índices de optimización
CREATE INDEX IX_proyectos_direccion ON dbo.proyectos(direccion_id);
CREATE INDEX IX_pagos_proyecto ON dbo.pagos_programados(proyecto_id);
CREATE INDEX IX_audit_logs_fecha ON dbo.audit_logs(fecha DESC);
