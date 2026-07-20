// config.js - Carga centralizada de configuraciones de appsettings.json y .env
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Buscar el archivo appsettings.json
const appsettingsPath = path.resolve(__dirname, '../../appsettings.json');
let appsettings = {};

try {
  if (fs.existsSync(appsettingsPath)) {
    const rawData = fs.readFileSync(appsettingsPath, 'utf-8');
    appsettings = JSON.parse(rawData);
  }
} catch (error) {
  console.error('Error leyendo appsettings.json:', error.message);
}

// Configuración unificada
export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Base de datos (SQL Server)
  db: {
    connectionString: appsettings.ConnectionStrings?.DefaultConnection || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || '',
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || appsettings.Jwt?.SecretKey || '3c7f8d2b7a9e6f3c8d5e1a7b5c2d4f6e8a9b3c5d7e9f5a4b6c8d1e3f5a7b9c1',
    issuer: appsettings.Jwt?.Issuer || 'MiSistema',
    audience: appsettings.Jwt?.Audience || 'MiSistemaUsuarios',
    expirationMinutes: appsettings.Jwt?.ExpirationMinutes || 60,
    refreshTokenExpirationDays: appsettings.Jwt?.RefreshTokenExpirationDays || 7
  },
  
  // Seguridad
  security: {
    bcryptSaltRounds: appsettings.Security?.BcryptSaltRounds || 12,
    enableCors: appsettings.Security?.EnableCors ?? true,
    allowedOrigins: appsettings.Security?.AllowedOrigins || ['http://localhost:5173']
  }
};

export default config;
