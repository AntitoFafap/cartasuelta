import db from '../../../lib/db';

export default async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener token de la cookie
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/userToken=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (token) {
      // Buscar y eliminar la sesión en MySQL
      await db.query('DELETE FROM user_sessions WHERE token = ?', [token]);
    }

    // Eliminar cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = isProduction
      ? 'Path=/; HttpOnly; Secure; SameSite=Strict'
      : 'Path=/; HttpOnly; SameSite=Strict';

    res.setHeader(
      'Set-Cookie',
      `userToken=; ${cookieOptions}; Max-Age=0`
    );

    return res.status(200).json({ success: true, message: 'Sesión cerrada' });
  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(500).json({ error: 'Error cerrando sesión' });
  }
}
