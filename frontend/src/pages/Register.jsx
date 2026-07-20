// Register.jsx - Página de Registro de Usuarios
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { User, Lock, Mail, Shield, Briefcase } from 'lucide-react';

const STATIC_ROLES = [
  { id: 1, nombre: 'Máxima autoridad / Alcaldía' },
  { id: 2, nombre: 'Director/a de Gestión' },
  { id: 3, nombre: 'Dirección Financiera' },
  { id: 4, nombre: 'Administrador' }
];

const STATIC_DIRECCIONES = [
  { id: 1, nombre: 'Dirección de Obras Públicas' },
  { id: 2, nombre: 'Dirección de Movilidad y Tránsito' },
  { id: 3, nombre: 'Dirección de Desarrollo Social' },
  { id: 4, nombre: 'Dirección de Planificación y Proyectos' }
];

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(1);
  const [direccionId, setDireccionId] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        nombre,
        email,
        password,
        roleId,
        direccionId: Number(roleId) === 2 ? direccionId : null
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al registrar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b132b] px-4 py-8">
      <div className="bg-white dark:bg-[#1c2541] p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-5">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="h-10 w-10 mx-auto rounded-lg overflow-hidden shadow-md border border-yellow-400 bg-white flex items-center justify-center">
          <img
            src="https://registrodelapropiedadriobamba.gob.ec/assets/img/logo-cuadrado-f.webp"
            alt="Logo GAD Riobamba"
            className="w-full h-full object-contain"
          />
        </div>
          <h2 className="font-title font-bold text-lg text-slate-850 dark:text-white mt-3">
            Crear Nueva Cuenta GADMR
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Registro de funcionarios autorizados
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-[#D90429] text-[#D90429] text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          <div>
            <label className="block text-slate-500 mb-0.5 font-semibold">Nombre Completo:</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input 
                type="text" 
                required 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ing. Carlos Mendoza"
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl pl-10 pr-3 py-2 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-0.5 font-semibold">Correo Electrónico:</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@riobamba.gob.ec"
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl pl-10 pr-3 py-2 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-0.5 font-semibold">Contraseña:</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl pl-10 pr-3 py-2 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-0.5 font-semibold">Rol Asignado:</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Shield className="h-4 w-4" />
              </span>
              <select 
                value={roleId}
                onChange={(e) => {
                  setRoleId(Number(e.target.value));
                  if (Number(e.target.value) === 2 && !direccionId) {
                    setDireccionId(STATIC_DIRECCIONES[0].id);
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl pl-10 pr-3 py-2 focus:outline-none"
              >
                {STATIC_ROLES.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mostrar selector de dirección únicamente si es Rol Director */}
          {Number(roleId) === 2 && (
            <div className="animate-fadeIn">
              <label className="block text-slate-500 mb-0.5 font-semibold">Dirección de Gestión:</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Briefcase className="h-4 w-4" />
                </span>
                <select 
                  value={direccionId}
                  onChange={(e) => setDireccionId(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl pl-10 pr-3 py-2 focus:outline-none"
                >
                  {STATIC_DIRECCIONES.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-[#0B2545] hover:bg-[#134074] disabled:bg-slate-350 text-white font-bold rounded-xl shadow-md transition-all text-xs uppercase tracking-wide"
          >
            {loading ? 'Creando Cuenta...' : 'Registrarse'}
          </button>

        </form>

        <div className="text-center pt-1">
          <span className="text-[11px] text-slate-400">¿Ya tienes una cuenta? </span>
          <Link to="/login" className="text-xs font-bold text-[#134074] dark:text-[#8DA9C4] hover:underline">
            Inicia sesión aquí
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
