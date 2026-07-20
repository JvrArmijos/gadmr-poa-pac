// errorMiddleware.js - Manejo global de excepciones y formateo de errores
export const errorHandler = (err, req, res, next) => {
  console.error('--- EXCEPCIÓN DETECTADA ---');
  console.error('Mensaje:', err.message);
  console.error('Stack:', err.stack);
  console.error('---------------------------');

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    error: err.message || 'Ocurrió un error interno en el servidor.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

export default errorHandler;
