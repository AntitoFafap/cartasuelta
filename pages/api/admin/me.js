const middleware = require('../../../lib/middleware.js');
const auth = require('../../../lib/auth.js');
const db = require('../../../lib/db').default || require('../../../lib/db');

module.exports = async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Solo acepta GET
  if (req.method !== 'GET') {
    return middleware.sendMethodNotAllowed(res, ['GET']);
  }

  try {
    // Primero intentar con adminToken (legacy)
    const cookie = req.headers.cookie || '';
    const adminTokenMatch = cookie.match(/adminToken=([^;]+)/);
    if (adminTokenMatch) {
      const adminToken = adminTokenMatch[1];
      const [adminSessionRows] = await db.query('SELECT * FROM admin_sessions WHERE token = ?', [adminToken]);
      const adminSession = adminSessionRows[0];
      if (adminSession && adminSession.expiresAt > Math.floor(Date.now() / 1000)) {
        const [adminRows] = await db.query('SELECT * FROM admins WHERE id = ?', [adminSession.adminId]);
        const admin = adminRows[0];
        if (admin) {
          return middleware.sendSuccess(res, {
            ok: true,
            id: admin.id,
            username: admin.username,
            role: admin.role || 'Admin',
            email: admin.email || '',
            isActive: admin.isActive !== false,
          });
        }
      }
    }
    // Si no hay adminToken, intentar con userToken
    const userTokenMatch = cookie.match(/userToken=([^;]+)/);
    if (userTokenMatch) {
      const userToken = userTokenMatch[1];
      const [userSessionRows] = await db.query('SELECT * FROM user_sessions WHERE token = ?', [userToken]);
      const userSession = userSessionRows[0];
      if (userSession && userSession.expiresAt > Math.floor(Date.now() / 1000)) {
        const [adminRows] = await db.query('SELECT * FROM admins WHERE id = ?', [userSession.userId]);
        const admin = adminRows[0];
        if (admin && admin.isActive) {
          return middleware.sendSuccess(res, {
            ok: true,
            id: admin.id,
            username: admin.username,
            role: admin.role || 'Admin',
            email: admin.email || '',
            isActive: admin.isActive !== false,
          });
        }
      }
    }
    return middleware.sendUnauthorized(res, 'Sesión no válida o no es administrador');
  } catch (error) {
    console.error('Error en /api/admin/me:', error);
    middleware.logSecurityEvent('ME_ERROR', { error: error.message });
    return middleware.sendServerError(res, 'Error obteniendo información');
  }
}

