// commonController.js - Controlador para catálogos del sistema e historial
import * as commonRepository from '../repositories/commonRepository.js';

export const getRoles = async (req, res, next) => {
  try {
    const roles = await commonRepository.getRoles();
    return res.status(200).json(roles);
  } catch (err) {
    next(err);
  }
};

export const getDirecciones = async (req, res, next) => {
  try {
    const direcciones = await commonRepository.getDirecciones();
    return res.status(200).json(direcciones);
  } catch (err) {
    next(err);
  }
};

export const getPartidas = async (req, res, next) => {
  try {
    const partidas = await commonRepository.getPartidas();
    return res.status(200).json(partidas);
  } catch (err) {
    next(err);
  }
};

export const getHistorialEtapas = async (req, res, next) => {
  try {
    const historial = await commonRepository.getHistorialEtapas();
    return res.status(200).json(historial);
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await commonRepository.getAuditLogs();
    return res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
};
