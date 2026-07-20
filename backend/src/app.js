// app.js - Configuración del Servidor Express
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/config.js';

// Middlewares
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Rutas
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import commonRoutes from './routes/commonRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();

// 1. Configuración de seguridad (Helmet)
app.use(helmet());

// 2. Configuración de CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Si CORS está deshabilitado en configuración, permitir todo
    if (!config.security.enableCors) {
      return callback(null, true);
    }
    
    // Permitir solicitudes sin origen (como apps móviles, curl, insomnia)
    if (!origin) return callback(null, true);
    
    if (config.security.allowedOrigins.indexOf(origin) !== -1 || config.security.allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por políticas CORS de GADMR.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 3. Logger de peticiones HTTP en desarrollo
app.use(morgan('dev'));

// 4. Parser de cuerpo JSON
app.use(express.json());

// 5. Aplicar limitador de velocidad global a la API
app.use('/api', apiLimiter);

// 6. Registro de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/proyectos', projectRoutes);
app.use('/api/common', commonRoutes);
app.use('/api/ai', aiRoutes);

// Ruta base informativa
app.get('/', (req, res) => {
  res.json({
    sistema: 'GAD Municipal de Riobamba - Control POA/PAC',
    estado: 'Servicio en línea',
    version: '1.0.0'
  });
});

// 7. Middleware para rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  next(error);
});

// 8. Manejo centralizado de excepciones (Errores 500)
app.use(errorHandler);

export default app;
