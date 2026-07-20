// projectRoutes.js - Rutas protegidas para administración de proyectos y cadena del gasto
import express from 'express';
import * as projectController from '../controllers/projectController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateProject } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Todas las rutas de proyectos requieren inicio de sesión previo
router.use(authenticateToken);

// Obtener todos los proyectos (con filtros opcionales de búsqueda, dirección, etapa, pagos)
router.get('/', projectController.getProjects);

// Obtener proyectos georreferenciados para el mapa
router.get('/mapa', projectController.getProjectsMap);

// Obtener detalle completo de un proyecto por su ID
router.get('/:id', projectController.getProjectById);

// Registrar Nuevo Proyecto (Permitido para Administradores, Finanzas o Directores)
router.post('/', authorizeRoles('Administrador', 'Dirección Financiera', 'Director'), validateProject, projectController.createProject);

// Modificar Proyecto (Permitido para Administradores, Finanzas o Directores)
router.put('/:id', authorizeRoles('Administrador', 'Dirección Financiera', 'Director'), validateProject, projectController.updateProject);

// Eliminar Proyecto (RESTRICCIÓN: Solo permitido para el Administrador)
router.delete('/:id', authorizeRoles('Administrador'), projectController.deleteProject);

// Registrar pago de un hito/planilla (RESTRICCIÓN: Solo permitido para Administradores o Dirección Financiera)
router.post('/:id/pagos/:pagoId/registrar', authorizeRoles('Administrador', 'Dirección Financiera'), projectController.recordPayment);

export default router;
