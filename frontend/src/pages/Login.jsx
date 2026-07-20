// Login.jsx - Página de inicio de sesión
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b132b] px-4">
      <div className="bg-white dark:bg-[#1c2541] p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-6">
        
        {/* Encabezado Logo */}
        <div className="text-center space-y-2">
          <div className="h-10 w-10 mx-auto rounded-lg overflow-hidden shadow-md border border-yellow-400 bg-white flex items-center justify-center">
          <img
            src="https://registrodelapropiedadriobamba.gob.ec/assets/img/logo-cuadrado-f.webp"
            alt="Logo GAD Riobamba"
            className="w-full h-full object-contain"
          />
        </div>
          <h2 className="font-title font-bold text-xl text-slate-800 dark:text-white mt-4">
            GAD MUNICIPAL DE RIOBAMBA
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Control de Proyectos POA/PAC
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-[#D90429] text-[#D90429] text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Correo Electrónico:</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@riobamba.gob.ec"
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Contraseña:</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-[#134074]"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#0B2545] hover:bg-[#134074] disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition-all text-xs uppercase tracking-wide"
          >
            {loading ? 'Iniciando Sesión...' : 'Ingresar al Sistema'}
          </button>

        </form>

        {/* Registro opcional */}
        <div className="text-center pt-2">
          <span className="text-[11px] text-slate-400">¿No tienes una cuenta aún? </span>
          <Link to="/register" className="text-xs font-bold text-[#134074] dark:text-[#8DA9C4] hover:underline">
            Regístrate aquí
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
