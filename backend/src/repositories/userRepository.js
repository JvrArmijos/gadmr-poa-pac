// userRepository.js - Acceso a datos de Usuarios y Roles en SQL Server
import { query, sql } from '../database/connection.js';

export const findByEmail = async (email) => {
  const result = await query(
    'SELECT u.*, r.nombre as role_nombre FROM dbo.usuarios u JOIN dbo.roles r ON u.role_id = r.id WHERE u.email = @email',
    { email }
  );
  return result.recordset[0] || null;
};

export const findById = async (id) => {
  const result = await query(
    'SELECT u.id, u.nombre, u.email, u.role_id, u.direccion_id, r.nombre as role_nombre FROM dbo.usuarios u JOIN dbo.roles r ON u.role_id = r.id WHERE u.id = @id',
    { id }
  );
  return result.recordset[0] || null;
};

export const create = async ({ nombre, email, passwordHash, roleId, direccionId }) => {
  const result = await query(
    `INSERT INTO dbo.usuarios (nombre, email, password_hash, role_id, direccion_id)
     OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.email, INSERTED.role_id, INSERTED.direccion_id
     VALUES (@nombre, @email, @passwordHash, @roleId, @direccionId)`,
    {
      nombre,
      email,
      passwordHash,
      roleId,
      direccionId: direccionId || null
    }
  );
  return result.recordset[0];
};

export const updateRefreshToken = async (userId, token, expirationDate) => {
  await query(
    `UPDATE dbo.usuarios 
     SET refresh_token = @token, refresh_token_expira = @expirationDate 
     WHERE id = @userId`,
    {
      userId,
      token,
      expirationDate
    }
  );
};

export const findByRefreshToken = async (token) => {
  const result = await query(
    'SELECT u.*, r.nombre as role_nombre FROM dbo.usuarios u JOIN dbo.roles r ON u.role_id = r.id WHERE u.refresh_token = @token',
    { token }
  );
  return result.recordset[0] || null;
};

export const clearRefreshToken = async (userId) => {
  await query(
    'UPDATE dbo.usuarios SET refresh_token = NULL, refresh_token_expira = NULL WHERE id = @userId',
    { userId }
  );
};
