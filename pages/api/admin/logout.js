const auth = require('../../../lib/auth.js');
const middleware = require('../../../lib/middleware.js');

export default async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Solo acepta POST
  if (req.method !== 'POST') {
    return middleware.sendMethodNotAllowed(res, ['POST']);
  }

  try {
    // Obtiene token
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/adminToken=([^;]+)/);
    const token = match ? match[1] : null;

    if (token) {
      await auth.destroySession(token);
    }

    // Limpia cookie
    res.setHeader(
      'Set-Cookie',
      'adminToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    );

    middleware.logSecurityEvent('LOGOUT_SUCCESS', { token: token ? 'valid' : 'none' });
    return middleware.sendSuccess(res, { ok: true, message: 'Sesión cerrada' });
  } catch (error) {
    middleware.logSecurityEvent('LOGOUT_ERROR', { error: error.message });
    return middleware.sendServerError(res, 'Error cerrando sesión');
  }
}

