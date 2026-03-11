const auth = require('../../../lib/auth.js');
const middleware = require('../../../lib/middleware.js');
const security = require('../../../lib/security.js');

export default async function handler(req, res) {
    // Fix para Next.js local: parsear body si viene como string
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).send('Invalid JSON');
      }
    }
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Solo acepta POST
  if (req.method !== 'POST') {
    return middleware.sendMethodNotAllowed(res, ['POST']);
  }

  const { username, password } = req.body;

  // Obtiene IP del cliente para logging
  const clientIP = security.getClientIP(req);

  // Valida credenciales están presentes
  if (!username || !password) {
    return middleware.sendBadRequest(res, 'Usuario y contraseña requeridos');
  }

  // Valida formato de credenciales
  if (!security.validateCredentials(username, password)) {
    middleware.logSecurityEvent('LOGIN_INVALID_FORMAT', { username, ip: clientIP });
    return middleware.sendBadRequest(res, 'Credenciales inválidas');
  }

  try {
    // Verifica admin (ahora es async porque consulta la BD)
    const adminUser = await auth.verifyAdmin(username, password);
    
    if (!adminUser) {
      middleware.logSecurityEvent('LOGIN_FAILED', { username, ip: clientIP });
      // Respuesta genérica para no revelar qué falló
      return middleware.sendUnauthorized(res, 'Credenciales inválidas');
    }

    // Crea sesión con datos del usuario (incluyendo role)
    const token = await auth.createSession(adminUser);
    
    if (!token) {
      return middleware.sendServerError(res, 'Error iniciando sesión');
    }

    middleware.logSecurityEvent('LOGIN_SUCCESS', { username, ip: clientIP });

    // Set httpOnly cookie (segura contra XSS)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = isProduction
      ? 'Path=/; HttpOnly; Secure; SameSite=Strict'
      : 'Path=/; HttpOnly; SameSite=Strict';
    
    res.setHeader(
      'Set-Cookie',
      `adminToken=${token}; ${cookieOptions}; Max-Age=${24 * 60 * 60}`
    );

    return middleware.sendSuccess(res, { ok: true, message: 'Acceso concedido' });
  } catch (error) {
    middleware.logSecurityEvent('LOGIN_ERROR', { error: error.message });
    return middleware.sendServerError(res, 'Error procesando solicitud');
  }
}

