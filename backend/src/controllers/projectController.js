// projectController.js - Controlador para CRUD de proyectos, avances e hitos
import * as projectRepository from '../repositories/projectRepository.js';
import * as projectService from '../services/projectService.js';

export const getProjects = async (req, res, next) => {
  try {
    const { search, direccionId, etapa, paymentStatus } = req.query;
    
    // Si el rol es Director, se restringe estrictamente a su propia dirección
    let filterDir = direccionId;
    if (req.user && req.user.role_nombre.toLowerCase().includes('director')) {
      filterDir = req.user.direccion_id;
    }

    const projects = await projectRepository.getAll({
      search,
      direccionId: filterDir,
      etapa,
      paymentStatus
    });
    return res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await projectRepository.getById(id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }
    return res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Si el rol es Director, forzar su dirección asociada
    if (req.user.role_nombre.toLowerCase().includes('director')) {
      req.body.direccion_id = req.user.direccion_id;
    }

    const projectId = await projectService.createProject(req.body, userId);
    return res.status(201).json({ 
      mensaje: 'Proyecto registrado exitosamente.', 
      id: projectId 
    });
  } catch (err) {
    res.statusCode = 400;
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Si el rol es Director, forzar su dirección asociada
    if (req.user.role_nombre.toLowerCase().includes('director')) {
      req.body.direccion_id = req.user.direccion_id;
    }

    await projectService.updateProject(id, req.body, userId);
    return res.status(200).json({ mensaje: 'Proyecto actualizado con éxito.' });
  } catch (err) {
    res.statusCode = 400;
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await projectService.deleteProject(id, userId);
    return res.status(200).json({ mensaje: 'Proyecto eliminado con éxito.' });
  } catch (err) {
    res.statusCode = 400;
    next(err);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { id, pagoId } = req.params;
    const { fecha_real_pago } = req.body;
    const userId = req.user.id;

    if (!fecha_real_pago) {
      return res.status(400).json({ error: 'La fecha de pago es obligatoria.' });
    }

    await projectService.recordPayment(id, pagoId, fecha_real_pago, userId);
    return res.status(200).json({ mensaje: 'Pago registrado y presupuesto recalculado con éxito.' });
  } catch (err) {
    res.statusCode = 400;
    next(err);
  }
};

export const getProjectsMap = async (req, res, next) => {
  try {
    const projectsMap = await projectRepository.getProjectsMap();
    return res.status(200).json(projectsMap);
  } catch (err) {
    next(err);
  }
};

