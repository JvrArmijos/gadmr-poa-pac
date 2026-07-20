// commonRoutes.js - Rutas para catálogos y auditorías generales
import express from 'express';
import * as commonController from '../controllers/commonController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren token de sesión válido
router.use(authenticateToken);

// Obtener catálogo de Roles
router.get('/roles', commonController.getRoles);

// Obtener catálogo de Direcciones Municipales
router.get('/direcciones', commonController.getDirecciones);

// Obtener catálogo de Partidas Presupuestarias del POA
router.get('/partidas', commonController.getPartidas);

// Obtener historial de transiciones de etapa de proyectos
router.get('/historial-etapas', commonController.getHistorialEtapas);

// Obtener Logs de auditoría (Restringido para Administradores o Dirección Financiera)
router.get('/logs', authorizeRoles('Administrador', 'Dirección Financiera'), commonController.getAuditLogs);

export default router;
