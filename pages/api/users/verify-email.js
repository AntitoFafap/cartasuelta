import db from '../../../lib/db';

export default async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email y código son requeridos' });
  }

  try {
    // Buscar usuario en MySQL
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    // Verificar código
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Código de verificación inválido' });
    }
    // Marcar email como verificado
    await db.query('UPDATE users SET emailVerified = ?, verificationCode = NULL WHERE id = ?', [true, user.id]);
    return res.status(200).json({ 
      success: true, 
      message: 'Email verificado correctamente' 
    });
  } catch (error) {
    console.error('Error verificando email:', error);
    return res.status(500).json({ error: 'Error verificando email' });
  }
}
