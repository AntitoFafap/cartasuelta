const crypto = require('crypto');

// Whitelist de caracteres permitidos para nombres
const SAFE_NAME_REGEX = /^[a-zA-Z0-9\s\-\.áéíóúñÁÉÍÓÚÑ]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sanitiza y valida entrada de texto
 */
function sanitizeText(input, maxLength = 255) {
  if (typeof input !== 'string') return null;
  // Remove leading/trailing whitespace
  let text = input.trim();
  
  // Limita longitud
  if (text.length > maxLength) {
    text = text.substring(0, maxLength);
  }
  
  // Previene inyección básica removiendo caracteres peligrosos
  text = text
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/["'`;]/g, ''); // Remove quotes and backticks
  
  return text.trim() || null;
}

/**
 * Valida nombre de carta
 */
function validateCardName(name) {
  if (!name || typeof name !== 'string') return false;
  if (name.length < 2 || name.length > 100) return false;
  return SAFE_NAME_REGEX.test(name);
}

/**
 * Valida set/colección
 */
function validateSet(set) {
  if (!set || typeof set !== 'string') return false;
  if (set.length < 2 || set.length > 100) return false;
  return SAFE_NAME_REGEX.test(set);
}

/**
 * Valida precio (debe ser número positivo)
 */
function validatePrice(price) {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0 && num <= 999999.99;
}

/**
 * Valida rareza
 */
function validateRarity(rarity) {
  const validRarities = ['Común', 'Poco Común', 'Raro', 'Ultra Raro', 'Secreto Raro'];
  return validRarities.includes(rarity);
}

/**
 * Valida una URL de imagen (debe ser http(s) y longitud razonable)
 */
function validateImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length > 2048 || trimmed.length < 5) return false;
  
  // Solo aceptar URLs que comiencen con http:// o https://
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

function sanitizeUrl(url, maxLength = 2048) {
  if (typeof url !== 'string') return null;
  const u = url.trim();
  if (u.length === 0) return null;
  return u.length > maxLength ? u.substring(0, maxLength) : u;
}

/**
 * Valida credenciales de admin
 */
function validateCredentials(username, password) {
  if (!username || typeof username !== 'string') return false;
  if (!password || typeof password !== 'string') return false;
  
  // Username: 3-50 caracteres, alfanuméricos y guión bajo
  if (username.length < 3 || username.length > 50) return false;
  if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) return false;
  
  // Password: mínimo 6 caracteres
  if (password.length < 6 || password.length > 128) return false;
  
  return true;
}

/**
 * Rate limiting simple en memoria (para producción usar Redis)
 */
const rateLimitStore = new Map();

function checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { attempts: 1, resetAt: now + windowMs });
    return true;
  }
  
  const record = rateLimitStore.get(key);
  
  // Reset si pasó la ventana de tiempo
  if (now > record.resetAt) {
    rateLimitStore.set(key, { attempts: 1, resetAt: now + windowMs });
    return true;
  }
  
  // Rechaza si excedió intentos
  if (record.attempts >= maxAttempts) {
    return false;
  }
  
  record.attempts += 1;
  return true;
}

/**
 * Genera token seguro CSRF
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Valida token CSRF
 */
function verifyCSRFToken(token, storedToken) {
  if (!token || !storedToken) return false;
  // Comparación constante para prevenir timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
}

/**
 * Hash de contraseña simple (en producción usar bcrypt)
 * Esto es temporal; usa esto hasta obtener bcrypt instalado
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica contraseña
 */
function verifyPassword(password, hashedPassword) {
  const [salt, hash] = hashedPassword.split(':');
  if (!salt || !hash) return false;
  
  const newHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(newHash));
}

/**
 * Obtiene IP del cliente (respeta proxies)
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Valida método HTTP
 */
function validateMethod(req, allowedMethods) {
  return allowedMethods.includes(req.method);
}

module.exports = {
  sanitizeText,
  validateCardName,
  validateSet,
  validatePrice,
  validateRarity,
  validateImageUrl,
  sanitizeUrl,
  validateCredentials,
  checkRateLimit,
  generateCSRFToken,
  verifyCSRFToken,
  hashPassword,
  verifyPassword,
  getClientIP,
  validateMethod,
};
