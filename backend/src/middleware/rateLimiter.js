// rateLimiter.js - Limitador de peticiones para mitigar ataques DDoS y fuerza bruta
import rateLimit from 'express-rate-limit';

// Limitador general para toda la API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Máximo 200 peticiones por ventana por IP
  message: {
    error: 'Has excedido el límite de solicitudes permitido (200 solicitudes cada 15 minutos). Por favor intente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limitador estricto para autenticación (Login / Registro)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // Máximo 30 intentos por ventana por IP
  message: {
    error: 'Demasiados intentos de autenticación desde esta dirección IP. Por favor intente nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
