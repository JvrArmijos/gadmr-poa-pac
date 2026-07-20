// aiController.js - Controlador para generación de Reportes IA y consultas del Chatbot
import * as aiService from '../services/aiService.js';
import * as reportRepository from '../repositories/reportRepository.js';

export const generateReport = async (req, res, next) => {
  try {
    const { tipoReporte, anio, mes, semestre } = req.body;
    const userId = req.user.id;
    const result = await aiService.generateExecutiveReport(userId, tipoReporte || 'anual', anio, mes, semestre);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const queryChatbot = async (req, res, next) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({ error: 'La consulta es requerida.' });
    }

    const responseText = await aiService.parseChatbotQuery(query, userId);
    return res.status(200).json({ response: responseText });
  } catch (err) {
    next(err);
  }
};

export const getSavedReports = async (req, res, next) => {
  try {
    const reports = await reportRepository.getReports();
    return res.status(200).json(reports);
  } catch (err) {
    next(err);
  }
};
