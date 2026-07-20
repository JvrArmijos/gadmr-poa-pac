// authController.js - Controlador para peticiones de autenticación y sesiones
import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { nombre, email, password, roleId, direccionId } = req.body;
    const result = await authService.register({
      nombre,
      email,
      password,
      roleId,
      direccionId
    });
    return res.status(201).json(result);
  } catch (err) {
    res.statusCode = 400;
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return res.status(200).json(result);
  } catch (err) {
    res.statusCode = 401;
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Token de refresco requerido.' });
    }
    const result = await authService.refresh(refreshToken);
    return res.status(200).json(result);
  } catch (err) {
    res.statusCode = 401;
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await authService.logout(userId);
    return res.status(200).json({ mensaje: 'Sesión cerrada exitosamente.' });
  } catch (err) {
    next(err);
  }
};

export const getProfile = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  return res.status(200).json({ user: req.user });
};
