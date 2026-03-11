const { getSession } = require('./auth.js');
const { getClientIP } = require('./security.js');

/**
 * Middleware para verificar autenticación
 * Se usa en rutas que requieren sesión de admin
 */
async function requireAuth(req, res) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/adminToken=([^;]+)/);
  
  if (!match) {
    return null;
  }
  
  const token = match[1];
  const session = await getSession(token);
  
  if (!session) {
    return null;
  }
  
  return session;
}

/**
 * Middleware para verificar autenticación de usuario cliente
 * Se usa en rutas que requieren sesión de usuario (checkout, pedidos, etc.)
 */
async function requireUserAuth(req, res) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/userToken=([^;]+)/);
  
  if (!match) {
    return null;
  }
  
  const token = match[1];
  // Buscar sesión de usuario en la base de datos
  try {
    const db = require('./db').default || require('./db');
    const [rows] = await db.query('SELECT * FROM user_sessions WHERE token = ?', [token]);
    const session = rows[0];
    if (!session) {
      return null;
    }
    // Verificar que la sesión no haya expirado
    if (session.expiresAt && session.expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return session;
  } catch (error) {
    console.error('Error verificando sesión de usuario:', error);
    return null;
  }
}

/**
 * Retorna respuesta de error no autorizado
 */
function sendUnauthorized(res, message = 'No autorizado') {
  return res.status(401).json({
    error: message,
    code: 'UNAUTHORIZED'
  });
}

/**
 * Retorna respuesta de error validación
 */
function sendBadRequest(res, message = 'Solicitud inválida') {
  return res.status(400).json({
    error: message,
    code: 'BAD_REQUEST'
  });
}

/**
 * Retorna respuesta de error servidor
 * IMPORTANTE: No revela detalles internos
 */
function sendServerError(res, message = 'Error interno del servidor', consoleError = null) {
  if (consoleError) {
    console.error('[Server Error]', consoleError);
  }
  return res.status(500).json({
    error: message,
    code: 'INTERNAL_ERROR'
  });
}

/**
 * Retorna respuesta de error método no permitido
 */
function sendMethodNotAllowed(res, allowedMethods = []) {
  res.setHeader('Allow', allowedMethods.join(', '));
  return res.status(405).json({
    error: 'Método no permitido',
    code: 'METHOD_NOT_ALLOWED',
    allowed: allowedMethods
  });
}

/**
 * Retorna respuesta de error no encontrado
 */
function sendNotFound(res, message = 'Recurso no encontrado') {
  return res.status(404).json({
    error: message,
    code: 'NOT_FOUND'
  });
}

/**
 * Retorna respuesta de éxito
 */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}

/**
 * Log de seguridad
 */
function logSecurityEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}`, details);
}

module.exports = {
  requireAuth,
  requireUserAuth,
  sendUnauthorized,
  sendBadRequest,
  sendServerError,
  sendMethodNotAllowed,
  sendNotFound,
  sendSuccess,
  logSecurityEvent,
};
