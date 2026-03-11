import { hashPassword } from '../../../lib/security.js';
import db from '../../../lib/db';

export default async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, código y nueva contraseña son requeridos' });
  }

  // Validar contraseña
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({ error: 'La contraseña debe incluir al menos una mayúscula' });
  }

  if (!/[a-z]/.test(newPassword)) {
    return res.status(400).json({ error: 'La contraseña debe incluir al menos una minúscula' });
  }

  if (!/[0-9]/.test(newPassword)) {
    return res.status(400).json({ error: 'La contraseña debe incluir al menos un número' });
  }

  try {
    // Buscar usuario
    const [userRows] = await db.query('SELECT * FROM admins WHERE email = ?', [email.toLowerCase().trim()]);
    const user = userRows[0];
    
    if (!user) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Verificar token
    if (user.resetPasswordToken !== code) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Verificar si expiró (resetPasswordExpires está en segundos)
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!user.resetPasswordExpires || nowSeconds > user.resetPasswordExpires) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Crear nuevo hash de contraseña
    const passwordHash = hashPassword(newPassword);

    // Actualizar usuario
    await db.query('UPDATE admins SET passwordHash = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?', [passwordHash, user.id]);

    return res.status(200).json({ 
      success: true, 
      message: 'Contraseña actualizada correctamente' 
    });
  } catch (error) {
    console.error('Error en reset-password:', error);
    return res.status(500).json({ error: 'Error actualizando contraseña' });
  }
}
