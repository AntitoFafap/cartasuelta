const auth = require('../../../../lib/auth.js');
const middleware = require('../../../../lib/middleware.js');
const security = require('../../../../lib/security.js');

// Función auxiliar para obtener el rol del usuario actual
async function getCurrentUserRole(req) {
  // Intentar con adminToken primero
  const session = await middleware.requireAuth(req, {});
  if (session) {
    const adminUser = await auth.getAdminByUsername(session.username);
    if (adminUser) {
      return { role: adminUser.role, username: adminUser.username };
    }
  }
  // Si se requiere lógica adicional para userToken, implementarla aquí usando SQL
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  try {
    // Verifica autenticación y obtiene rol
    const currentUser = await getCurrentUserRole(req);
    if (!currentUser) {
      return middleware.sendUnauthorized(res, 'Requiere autenticación');
    }
    
    // Solo superadmin puede gestionar usuarios
    if (currentUser.role !== 'superadmin') {
      return res.status(403).json({ error: 'Acceso denegado. Solo superadmin puede gestionar administradores.' });
    }

    const { username } = req.query;
    const method = req.method;

    if (!username || typeof username !== 'string') {
      return middleware.sendBadRequest(res, 'Usuario inválido');
    }

    if (method === 'PUT') {
      // Actualiza usuario
      const { role, email, password } = req.body;

      const updates = {};

      if (role) {
        const validRoles = ['Super Admin', 'Staff'];
        if (!validRoles.includes(role)) {
          return middleware.sendBadRequest(res, 'Rol no válido');
        }
        updates.role = role;
      }

      if (email) {
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return middleware.sendBadRequest(res, 'Email no válido');
        }
        updates.email = email;
      }

      if (password) {
        if (!security.validateCredentials('test', password)) {
          return middleware.sendBadRequest(res, 'Contraseña inválida');
        }
        updates.password = password;
      }

      // Buscar admin por username para obtener su id
      const admin = await auth.getAdminByUsername(username);
      if (!admin) {
        return middleware.sendNotFound(res, 'Usuario no encontrado');
      }

      const updated = await auth.updateAdmin(admin.id, updates);

      if (!updated) {
        return middleware.sendServerError(res, 'Error actualizando usuario');
      }

      middleware.logSecurityEvent('USER_UPDATED', {
        updatedBy: currentUser.username,
        username,
        fields: Object.keys(updates),
      });

      return middleware.sendSuccess(res, updated);
    }

    if (method === 'DELETE') {
      // Elimina usuario
      // No permite eliminar el usuario actual
      if (username === currentUser.username) {
        return middleware.sendBadRequest(res, 'No puedes eliminar tu propio usuario');
      }

      console.log('[DELETE USER] Buscando TODOS los usuarios con username:', username);

      // Buscar TODOS los admins con ese username (para eliminar duplicados)
      const admins = await auth.getAllAdminsByUsername(username);
      console.log('[DELETE USER] Admins encontrados:', admins.length, admins.map(a => a.id));
      
      if (!admins || admins.length === 0) {
        return middleware.sendNotFound(res, 'Usuario no encontrado');
      }

      // Eliminar TODOS los admins con ese username
      let deletedCount = 0;
      for (const admin of admins) {
        console.log('[DELETE USER] Eliminando admin con ID:', admin.id);
        const success = await auth.deleteAdmin(admin.id);
        console.log('[DELETE USER] Resultado eliminación:', success ? 'OK' : 'FAIL');
        if (success) deletedCount++;
      }

      if (deletedCount === 0) {
        return middleware.sendServerError(res, 'Error eliminando usuario');
      }

      middleware.logSecurityEvent('USER_DELETED', {
        deletedBy: currentUser.username,
        username,
        count: deletedCount,
      });

      return middleware.sendSuccess(res, { ok: true, message: `Usuario eliminado (${deletedCount} registros)` });
    }

    return middleware.sendMethodNotAllowed(res, ['PUT', 'DELETE']);
  } catch (error) {
    middleware.logSecurityEvent('USER_ID_ERROR', { error: error.message });
    return middleware.sendServerError(res, 'Error procesando solicitud');
  }
}
