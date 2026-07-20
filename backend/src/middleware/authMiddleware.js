// authMiddleware.js - Middleware de autenticación JWT y autorización de roles
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

// Validar que el token existe y sea válido
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Soporta formato Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Acceso denegado. No se proporcionó un token de autenticación.' 
    });
  }

  try {
    const verified = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
    
    req.user = verified; // Añadir información del usuario verificado al request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token de acceso expirado.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({ error: 'Token de acceso no válido.' });
  }
};

// Autorizar acceso según el rol
// Puede recibir IDs de roles o cadenas que correspondan al nombre del rol
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const { role_id, role_nombre } = req.user;

    // Normalizar roles para comparación robusta
    const isAllowed = allowedRoles.some(role => {
      if (typeof role === 'number') {
        return role_id === role;
      }
      if (typeof role === 'string') {
        const normRole = role.toLowerCase();
        return role_nombre.toLowerCase().includes(normRole);
      }
      return false;
    });

    if (!isAllowed) {
      return res.status(403).json({ 
        error: 'Acceso Prohibido: Tu rol no cuenta con los permisos necesarios para realizar esta acción.' 
      });
    }

    next();
  };
};
