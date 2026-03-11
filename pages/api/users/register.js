import crypto from 'crypto';
import { hashPassword } from '../../../lib/security.js';
const db = require('../../../lib/db').default || require('../../../lib/db');

module.exports = async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password, firstName, lastName, phone } = req.body;

  // Validaciones
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Validar contraseña
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: 'La contraseña debe incluir al menos una mayúscula' });
  }

  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ error: 'La contraseña debe incluir al menos una minúscula' });
  }

  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'La contraseña debe incluir al menos un número' });
  }

  try {
    // Verificar si el email ya existe
    const [existingRows] = await db.query('SELECT * FROM admins WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingRows.length > 0) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    // Crear hash de la contraseña
    const passwordHash = hashPassword(password);

    // Crear usuario (Admin en MySQL)
    const [result] = await db.query(
      'INSERT INTO admins (email, passwordHash, username, fullName, role, isActive, lastLogin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        email.toLowerCase().trim(),
        passwordHash,
        email.toLowerCase().trim(),
        (firstName?.trim() || '') + ' ' + (lastName?.trim() || ''),
        'user',
        true,
        null,
        new Date(),
        new Date()
      ]
    );
    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente.',
      userId: result.insertId,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error creando usuario: ' + error.message });
  }
}
