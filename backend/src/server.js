// server.js - Punto de arranque del servidor backend GADMR
import app from './app.js';
import config from './config/config.js';
import { getPool } from './database/connection.js';

const startServer = async () => {
  try {
    // 1. Validar la conexión a SQL Server en el arranque
    await getPool();
    
    // 2. Levantar el servidor Express
    app.listen(config.port, () => {
      console.log(`===========================================================`);
      console.log(` Servidor GADMR POA/PAC iniciado exitosamente.`);
      console.log(` Puerto de ejecución: ${config.port}`);
      console.log(` Entorno: ${config.nodeEnv}`);
      console.log(`===========================================================`);
    });
  } catch (error) {
    console.error('ERROR CRÍTICO AL INICIAR EL SERVIDOR GADMR:', error.message);
    process.exit(1);
  }
};

startServer();
