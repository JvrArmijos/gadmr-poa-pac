// aiRoutes.js - Rutas protegidas para servicios analíticos de Inteligencia Artificial
import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Requieren token de sesión
router.use(authenticateToken);

// Consultar al Asistente/Chatbot Analítico de IA
router.post('/chatbot', aiController.queryChatbot);

// Generar nuevo Reporte Ejecutivo con IA (Guardándolo automáticamente)
router.post('/reporte', aiController.generateReport);

// Obtener listado de reportes históricos guardados
router.get('/reportes', aiController.getSavedReports);

export default router;
