// useAuth.js - Hook personalizado para consumir el contexto de autenticación
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider.');
  }
  return context;
};

export default useAuth;
