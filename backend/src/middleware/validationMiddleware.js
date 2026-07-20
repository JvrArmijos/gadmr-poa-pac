// validationMiddleware.js - Validaciones estructuradas para payloads de entrada
import { body, validationResult } from 'express-validator';

// Procesador de errores generados
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Errores de validación en la solicitud.',
      details: errors.array().map(e => ({ campo: e.path, mensaje: e.msg }))
    });
  }
  next();
};

// Validaciones de Registro
export const validateRegister = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('email').isEmail().withMessage('Debe proporcionar un correo electrónico válido.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('roleId').isInt().withMessage('El ID de rol debe ser un número entero.'),
  body('direccionId').optional({ nullable: true }).isInt().withMessage('El ID de dirección debe ser un número entero.'),
  handleValidationErrors
];

// Validaciones de Login
export const validateLogin = [
  body('email').isEmail().withMessage('Debe proporcionar un correo electrónico válido.').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  handleValidationErrors
];

// Validaciones de Creación y Edición de Proyectos
export const validateProject = [
  body('nombre').trim().notEmpty().withMessage('El nombre del proyecto es obligatorio.'),
  body('codigo_proceso').trim().notEmpty().withMessage('El código de proceso es obligatorio.'),
  body('direccion_id').isInt().withMessage('La dirección de gestión asociada debe ser un ID numérico.'),
  body('vinculacion_poa').trim().notEmpty().withMessage('La vinculación del POA es obligatoria.'),
  body('vinculacion_pac').trim().notEmpty().withMessage('La vinculación del PAC es obligatoria.'),
  body('etapa').isIn(['Preparatoria', 'Precontractual', 'Contractual', 'Ejecución', 'Cierre']).withMessage('Etapa no válida.'),
  body('forma_pago').trim().notEmpty().withMessage('La forma de pago es obligatoria.'),
  body('fecha_inicio').isDate().withMessage('Fecha de inicio inválida (YYYY-MM-DD).'),
  body('fecha_fin').isDate().withMessage('Fecha de finalización inválida (YYYY-MM-DD).'),
  body('partidas').isArray({ min: 1 }).withMessage('Debe asociar al menos una partida presupuestaria.'),
  body('partidas.*.codigo').notEmpty().withMessage('El código de partida es requerido.'),
  body('partidas.*.monto_asignado').isFloat({ min: 0.01 }).withMessage('El monto de la partida debe ser mayor a cero.'),
  body('presupuesto.certificado').optional().isFloat({ min: 0 }).withMessage('Monto certificado debe ser numérico.'),
  body('presupuesto.comprometido').optional().isFloat({ min: 0 }).withMessage('Monto comprometido debe ser numérico.'),
  body('presupuesto.devengado').optional().isFloat({ min: 0 }).withMessage('Monto devengado debe ser numérico.'),
  body('presupuesto.pagado').optional().isFloat({ min: 0 }).withMessage('Monto pagado debe ser numérico.'),
  handleValidationErrors
];
