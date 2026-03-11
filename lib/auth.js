const crypto = require('crypto');
const { hashPassword, verifyPassword } = require('./security.js');
const db = require('./db').default || require('./db');

const SESSION_EXPIRY_SECONDS = 24 * 60 * 60; // 24 horas

/**
 * Consulta un admin por username usando MySQL
 */
async function getAdminByUsername(username) {
  if (!username) return null;
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    return rows[0] || null;
  } catch (e) {
    console.error('Error consultando admin:', e);
    return null;
  }
}

/**
 * Obtiene TODOS los admins con un username específico (para eliminar duplicados)
 */
async function getAllAdminsByUsername(username) {
  if (!username) return [];
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    return rows;
  } catch (e) {
    console.error('Error consultando admins por username:', e);
    return [];
  }
}

/**
 * Verifica credenciales de admin contra la base de datos
 */
async function verifyAdmin(username, password) {
  if (!username || !password) return null;
  try {
    const admin = await getAdminByUsername(username);
    if (!admin || !admin.isActive) {
      return null;
    }
    if (verifyPassword(password, admin.passwordHash)) {
      return {
        username: admin.username,
        role: admin.role || 'moderator',
        email: admin.email || '',
        id: admin.id,
      };
    }
  } catch (e) {
    console.error('Error verificando admin:', e);
    return null;
  }
  return null;
}

/**
 * Crea nueva sesión en MySQL
 * @param {Object} user - Objeto con username, role, email, id
 */
async function createSession(user) {
  if (!user || !user.username) return null;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_EXPIRY_SECONDS;
  try {
    await db.query(
      'INSERT INTO admin_sessions (token, username, role, email, adminId, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [token, user.username, user.role || 'moderator', user.email || null, user.id || null, expiresAt, Math.floor(Date.now() / 1000)]
    );
    return token;
  } catch (e) {
    console.error('Error creando sesión en MySQL:', e);
    return null;
  }
}

/**
 * Destruye sesión
 */
async function destroySession(token) {
  if (!token) return;
  try {
    await db.query('DELETE FROM admin_sessions WHERE token = ?', [token]);
  } catch (e) {
    console.error('Error eliminando sesión en MySQL:', e);
  }
}

/**
 * Busca sesión en MySQL por token
 */
async function getSessionFromDB(token) {
  if (!token) return null;
  try {
    const [rows] = await db.query('SELECT * FROM admin_sessions WHERE token = ?', [token]);
    return rows[0] || null;
  } catch (e) {
    console.error('Error consultando sesión en MySQL:', e);
    return null;
  }
}

/**
 * Obtiene sesión válida
 * Verifica expiración y retorna null si expiró
 */
async function getSession(token) {
  if (!token) return null;
  const dbSession = await getSessionFromDB(token);
  if (dbSession) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (nowInSeconds > dbSession.expiresAt) {
      await destroySession(token);
      return null;
    }
    return {
      username: dbSession.username,
      role: dbSession.role,
      email: dbSession.email,
      id: dbSession.adminId,
      createdAt: dbSession.createdAt,
      expiresAt: dbSession.expiresAt,
    };
  }
  return null;
}

/**
 * Limpia sesiones expiradas
 */
async function cleanExpiredSessions() {
  const now = Math.floor(Date.now() / 1000);
  try {
    await db.query('DELETE FROM admin_sessions WHERE expiresAt < ?', [now]);
  } catch (e) {
    console.error('Error limpiando sesiones expiradas:', e);
  }
}

/**
 * Obtiene todos los usuarios admin
 */
async function getAllAdmins() {
  try {
    const [rows] = await db.query('SELECT * FROM admins');
    return rows;
  } catch (e) {
    console.error('Error obteniendo admins:', e);
    return [];
  }
}

/**
 * Crea un nuevo usuario admin
 */
async function createAdmin(username, password, role = 'moderator', email = '') {
  try {
    if (!username || !password) return null;
    const passwordHash = hashPassword(password);
    const now = Math.floor(Date.now() / 1000);
    const [result] = await db.query(
      'INSERT INTO admins (username, email, passwordHash, role, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, role, true, now]
    );
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [result.insertId]);
    return rows[0] || null;
  } catch (e) {
    console.error('Error creando admin en MySQL:', e);
    return null;
  }
}

/**
 * Actualiza un usuario admin
 */
async function updateAdmin(id, updates) {
  try {
    if (!id) return null;
    const fields = [];
    const values = [];
    for (const key in updates) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
    values.push(id);
    await db.query(`UPDATE admins SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
    return rows[0] || null;
  } catch (e) {
    console.error('Error actualizando admin en MySQL:', e);
    return null;
  }
}

/**
 * Elimina un usuario admin
 */
async function deleteAdmin(id) {
  try {
    if (!id) {
      console.error('deleteAdmin: ID no proporcionado');
      return null;
    }
    await db.query('DELETE FROM admins WHERE id = ?', [id]);
    return true;
  } catch (e) {
    console.error('Error eliminando admin en MySQL:', e);
    return null;
  }
}

module.exports = {
  verifyAdmin,
  createSession,
  destroySession,
  getSession,
  cleanExpiredSessions,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminByUsername,
  getAllAdminsByUsername,
};
