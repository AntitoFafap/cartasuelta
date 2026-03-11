import crypto from 'crypto';
import db from '../../../lib/db';

export default async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  try {
    // Buscar usuario
    const [userRows] = await db.query('SELECT * FROM admins WHERE email = ?', [email.toLowerCase().trim()]);
    const user = userRows[0];
    
    // Por seguridad, siempre devolvemos éxito aunque no exista
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: 'Si el email existe, recibirás un código de recuperación' 
      });
    }

    // Generar token de reset (6 dígitos)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hora en segundos

    // Guardar token en usuario
    await db.query('UPDATE admins SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?', [resetToken, resetExpires, user.id]);

    // Log del código para desarrollo (sin envío de email)
    console.log(`Código de reset para ${email}: ${resetToken}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Si el email existe, recibirás un código de recuperación',
      // En desarrollo, devolvemos el código. Quitar en producción:
      ...(process.env.NODE_ENV !== 'production' && { resetToken }),
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return res.status(500).json({ error: 'Error procesando solicitud' });
  }
}
