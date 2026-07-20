// api.js - Cliente Axios configurado con interceptores para JWT y Refresh Token
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de Solicitud: Adjuntar el Access Token si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gadmr_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuesta: Controlar expiraciones 401 e intentar refresh token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si la respuesta es 401, el token expiró y no hemos reintentado aún la petición
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('gadmr_refresh_token');
      
      if (refreshToken) {
        try {
          // Intentar renovar el token
          const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          if (refreshRes.status === 200) {
            const { accessToken, refreshToken: newRefreshToken } = refreshRes.data;
            
            // Guardar nuevos tokens
            localStorage.setItem('gadmr_access_token', accessToken);
            localStorage.setItem('gadmr_refresh_token', newRefreshToken);
            
            // Re-ejecutar la petición original con el nuevo token
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Si el refresh token también expiró, forzar cierre de sesión
          console.error('Refresh token expirado o inválido, redirigiendo a login...');
          localStorage.removeItem('gadmr_access_token');
          localStorage.removeItem('gadmr_refresh_token');
          localStorage.removeItem('gadmr_user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    // Formatear el error para mejor consumo del frontend
    const errorMsg = error.response?.data?.error || 'Ocurrió un error en la solicitud.';
    return Promise.reject(new Error(errorMsg));
  }
);

export default api;
