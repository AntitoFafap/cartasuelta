const auth = require('../../../lib/auth.js');
const middleware = require('../../../lib/middleware.js');
const security = require('../../../lib/security.js');
import db from '../../../lib/db';

// Función auxiliar para obtener el rol del usuario actual
async function getCurrentUserRole(req) {
  // Intentar con adminToken primero
  const cookie = req.headers.cookie || '';
  const adminTokenMatch = cookie.match(/adminToken=([^;]+)/);
  if (adminTokenMatch) {
    const adminToken = adminTokenMatch[1];
    const [adminSessionRows] = await db.query('SELECT * FROM adminSessions WHERE token = ?', [adminToken]);
    const adminSession = adminSessionRows[0];
    if (adminSession && adminSession.expiresAt > Math.floor(Date.now() / 1000)) {
      const [adminUserRows] = await db.query('SELECT * FROM admins WHERE id = ?', [adminSession.adminId]);
      const adminUser = adminUserRows[0];
      if (adminUser) {
        return { role: adminUser.role, username: adminUser.username };
      }
    }
  }
  // Intentar con userToken
  const userTokenMatch = cookie.match(/userToken=([^;]+)/);
  if (userTokenMatch) {
    const userToken = userTokenMatch[1];
    const [userSessionRows] = await db.query('SELECT * FROM userSessions WHERE token = ?', [userToken]);
    const userSession = userSessionRows[0];
    if (userSession && userSession.expiresAt > Math.floor(Date.now() / 1000)) {
      const [adminRows] = await db.query('SELECT * FROM admins WHERE id = ?', [userSession.userId]);
      const admin = adminRows[0];
      if (admin && admin.isActive) {
        return { role: admin.role, username: admin.username };
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  try {
    // Verifica autenticación y obtiene rol
    const currentUser = await getCurrentUserRole(req);
    if (!currentUser) {
      return middleware.sendUnauthorized(res, 'Requiere autenticación');
    }

    const method = req.method;

    if (method === 'GET') {
      // Solo superadmin puede listar usuarios
      if (currentUser.role !== 'superadmin') {
        return res.status(403).json({ error: 'Acceso denegado. Solo superadmin puede ver la lista de administradores.' });
      }
      
      res.setHeader('Cache-Control', 'private, max-age=20');
      
      // Obtiene lista de usuarios de DynamoDB
      const admins = await auth.getAllAdmins();
      // No incluir passwordHash en la respuesta
      const users = admins.map(({ passwordHash, ...user }) => user);
      return middleware.sendSuccess(res, users);
    }

    if (method === 'POST') {
      // Solo superadmin puede crear usuarios
      if (currentUser.role !== 'superadmin') {
        return res.status(403).json({ error: 'Acceso denegado. Solo superadmin puede crear administradores.' });
      }
      
      // Crea nuevo usuario
      const { username, password, role, email } = req.body;

      // Validaciones
      if (!username || !password) {
        return middleware.sendBadRequest(res, 'Usuario y contraseña requeridos');
      }

      if (!security.validateCredentials(username, password)) {
        return middleware.sendBadRequest(res, 'Credenciales inválidas');
      }

      const validRoles = ['superadmin', 'moderator'];
      if (!validRoles.includes(role?.toLowerCase())) {
        return middleware.sendBadRequest(res, 'Rol no válido');
      }

      if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return middleware.sendBadRequest(res, 'Email no válido');
      }

      // Verificar que el usuario no existe
      const admins = await auth.getAllAdmins();
      if (admins.some(a => a.username === username)) {
        return middleware.sendBadRequest(res, 'El usuario ya existe');
      }

      // Crear nuevo usuario en DynamoDB (normalizar email a minúsculas)
      const normalizedEmail = (email || `${username}@pokemon.local`).toLowerCase().trim();
      const newUser = await auth.createAdmin(
        username, 
        password, 
        role?.toLowerCase() || 'moderator',
        normalizedEmail
      );

      if (!newUser) {
        return middleware.sendServerError(res, 'Error creando usuario');
      }

      middleware.logSecurityEvent('USER_CREATED', {
        createdBy: session.username,
        newUsername: username,
        role,
      });

      return middleware.sendSuccess(res, newUser, 201);
    }

    return middleware.sendMethodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    console.error('Error en /api/admin/users:', error);
    middleware.logSecurityEvent('USERS_ERROR', { error: error.message });
    return middleware.sendServerError(res, 'Error procesando solicitud');
  }
}
