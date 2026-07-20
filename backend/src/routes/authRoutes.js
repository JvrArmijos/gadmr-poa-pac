// authRoutes.js - Declaración de rutas de autenticación y sesión
import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validationMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Ruta de registro público (abierto para demostración/creación de cuentas)
router.post('/register', validateRegister, authController.register);

// Ruta de inicio de sesión público con limitador de velocidad
router.post('/login', authLimiter, validateLogin, authController.login);

// Ruta de renovación de Token de acceso mediante Refresh Token
router.post('/refresh', authController.refresh);

// Cerrar sesión
router.post('/logout', authenticateToken, authController.logout);

// Obtener perfil actual
router.get('/me', authenticateToken, authController.getProfile);

export default router;
