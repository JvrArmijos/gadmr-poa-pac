// connection.js - Administrador de conexión a Microsoft SQL Server
import sql from 'mssql';
import config from '../config/config.js';

let poolPromise = null;

// Construir objeto de configuración para mssql
const getDbConfig = () => {
  // Intentar parsear la cadena de conexión si existe
  const connStr = config.db.connectionString;
  
  if (connStr && connStr.includes('Data Source')) {
    // Si hay una cadena de conexión formal en appsettings.json, la usamos directamente
    return connStr;
  }

  // De lo contrario, configuramos con las propiedades individuales de .env / appsettings
  return {
    user: config.db.user,
    password: config.db.password,
    server: config.db.server,
    database: config.db.database,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };
};

export const getPool = () => {
  if (!poolPromise) {
    const dbConfig = getDbConfig();
    console.log('Iniciando conexión a Microsoft SQL Server...');
    poolPromise = sql.connect(dbConfig)
      .then(pool => {
        console.log('Conexión exitosa a Microsoft SQL Server establecida.');
        return pool;
      })
      .catch(err => {
        console.error('ERROR CRÍTICO: No se pudo conectar a Microsoft SQL Server:', err.message);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
};

// Utilidad para ejecutar consultas rápidamente
export const query = async (sqlString, params = {}) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Registrar parámetros si se proveen
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    return await request.query(sqlString);
  } catch (err) {
    console.error('Error ejecutando consulta SQL:', err.message);
    throw err;
  }
};

export { sql };
