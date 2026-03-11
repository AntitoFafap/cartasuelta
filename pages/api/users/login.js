import crypto from 'crypto';
import { verifyPassword } from '../../../lib/security.js';
import db from '../../../lib/db';

// Tiempo de expiración de sesión (7 días en segundos)
const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

export default async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

  // Validaciones
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[LOGIN] Email normalizado:', normalizedEmail);
    
    // Buscar usuario por email
    const [userRows] = await db.query('SELECT * FROM admins WHERE email = ?', [normalizedEmail]);
    let user = userRows[0];
    console.log('[LOGIN] Usuario encontrado:', user ? 'SI' : 'NO');
    
    let isAdmin = false;
    let adminRole = null;
    let adminData = null;
    
    // Buscar también en admins
    const [adminRows] = await db.query('SELECT * FROM admins WHERE email = ?', [normalizedEmail]);
    adminData = adminRows[0];
    if (adminData && adminData.isActive) {
      isAdmin = true;
      adminRole = adminData.role || 'moderator';
    }
    
    // Si no hay usuario normal pero sí admin, usar el admin para login
    if (!user && adminData) {
      console.log('[LOGIN] Intentando login como admin puro');
      // Login como admin puro (sin cuenta de usuario normal)
      if (!adminData.isActive) {
        return res.status(401).json({ error: 'Cuenta desactivada' });
      }
      
      // Verificar contraseña del admin
      console.log('[LOGIN] Verificando contraseña. Hash existe:', !!adminData.passwordHash);
      if (!adminData.passwordHash) {
        console.error('[LOGIN] ERROR: Admin no tiene passwordHash!');
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const passwordMatch = verifyPassword(password, adminData.passwordHash);
      console.log('[LOGIN] Contraseña coincide:', passwordMatch);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      // Crear token de sesión para admin
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Math.floor(Date.now() / 1000) + SESSION_EXPIRY_SECONDS;

      // Crear sesión de usuario
      // Aquí deberías guardar la sesión en una tabla UserSession de MySQL si la tienes
      
      // También crear sesión de admin
      // Si tienes lógica de sesión admin, implementa aquí
      
      // ...existing code...

      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = isProduction
        ? 'Path=/; HttpOnly; Secure; SameSite=Strict'
        : 'Path=/; HttpOnly; SameSite=Strict';

      // Setear ambas cookies: userToken y adminToken
      res.setHeader(
        'Set-Cookie',
        [`userToken=${token}; ${cookieOptions}; Max-Age=${7 * 24 * 60 * 60}`]
      );

      return res.status(200).json({
        success: true,
        user: {
          id: adminData.id,
          email: adminData.email,
          firstName: adminData.fullName || adminData.username,
          lastName: '',
          emailVerified: true,
          isAdmin: true,
          adminRole: adminData.role || 'moderator',
        },
      });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }

    // Verificar contraseña
    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Crear token de sesión
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_EXPIRY_SECONDS;

    // Guardar sesión en DynamoDB
    // Aquí deberías guardar la sesión en una tabla UserSession de MySQL si la tienes

    // Actualizar último login
    await db.query('UPDATE admins SET lastLogin = ? WHERE id = ?', [new Date(), user.id]);

    // Set cookie httpOnly
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = isProduction
      ? 'Path=/; HttpOnly; Secure; SameSite=Strict'
      : 'Path=/; HttpOnly; SameSite=Strict';

    // Preparar cookies
    const cookies = [`userToken=${token}; ${cookieOptions}; Max-Age=${7 * 24 * 60 * 60}`];
    
    // Si es admin, también crear sesión de admin
    if (isAdmin && adminData) {
      const auth = require('../../../lib/auth.js');
      const adminToken = await auth.createSession({
        username: adminData.username,
        role: adminData.role || 'moderator',
        email: adminData.email,
        id: adminData.id
      });
      if (adminToken) {
        cookies.push(`adminToken=${adminToken}; ${cookieOptions}; Max-Age=${7 * 24 * 60 * 60}`);
      }
    }

    res.setHeader('Set-Cookie', cookies);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        isAdmin,
        adminRole,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error en login: ' + error.message });
  }
}
