// authService.js - Servicio de lógica de negocio para autenticación JWT y roles
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js';
import config from '../config/config.js';

// Generar Hash de Contraseña
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(Number(config.security.bcryptSaltRounds));
  return await bcrypt.hash(password, salt);
};

// Comparar contraseña con Hash
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generar par de Tokens (Access Token + Refresh Token)
export const generateTokens = (user) => {
  const payload = {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    role_id: user.role_id,
    role_nombre: user.role_nombre,
    direccion_id: user.direccion_id
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: `${config.jwt.expirationMinutes}m`,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  });

  const refreshToken = jwt.sign({ id: user.id }, config.jwt.secret, {
    expiresIn: `${config.jwt.refreshTokenExpirationDays}d`,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  });

  return { accessToken, refreshToken };
};

// Iniciar Sesión (Login)
export const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error('Credenciales incorrectas (usuario no encontrado).');
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Credenciales incorrectas (contraseña inválida).');
  }

  const tokens = generateTokens(user);
  
  // Guardar Refresh Token en BD con fecha de expiración
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshTokenExpirationDays);
  await userRepository.updateRefreshToken(user.id, tokens.refreshToken, expiresAt);

  return {
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role_id: user.role_id,
      role_nombre: user.role_nombre,
      direccion_id: user.direccion_id
    },
    ...tokens
  };
};

// Registrar Usuario
export const register = async ({ nombre, email, password, roleId, direccionId }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new Error('El correo electrónico ya se encuentra registrado.');
  }

  const passwordHash = await hashPassword(password);
  
  const newUser = await userRepository.create({
    nombre,
    email,
    passwordHash,
    roleId,
    direccionId
  });

  // Obtener rol para responder con la estructura completa
  const userWithRole = await userRepository.findById(newUser.id);
  const tokens = generateTokens(userWithRole);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshTokenExpirationDays);
  await userRepository.updateRefreshToken(userWithRole.id, tokens.refreshToken, expiresAt);

  return {
    user: userWithRole,
    ...tokens
  };
};

// Refrescar Access Token
export const refresh = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await userRepository.findByRefreshToken(token);
    
    if (!user) {
      throw new Error('Token de refresco inválido o revocado.');
    }

    // Verificar si ya expiró en BD
    if (new Date() > new Date(user.refresh_token_expira)) {
      await userRepository.clearRefreshToken(user.id);
      throw new Error('El token de refresco ha expirado. Inicie sesión nuevamente.');
    }

    const tokens = generateTokens(user);

    // Actualizar refresh token para mayor seguridad (rotación)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshTokenExpirationDays);
    await userRepository.updateRefreshToken(user.id, tokens.refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role_id: user.role_id,
        role_nombre: user.role_nombre,
        direccion_id: user.direccion_id
      },
      ...tokens
    };
  } catch (err) {
    throw new Error(err.message || 'Error validando token de refresco.');
  }
};

// Cerrar Sesión (Logout)
export const logout = async (userId) => {
  await userRepository.clearRefreshToken(userId);
  return true;
};
