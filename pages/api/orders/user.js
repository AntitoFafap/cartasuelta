/**
 * API para obtener los pedidos del usuario actual
 * GET /api/orders/user
 */

import db from '../../../lib/db';
import { requireUserAuth } from '../../../lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar autenticación
  const session = await requireUserAuth(req, res);
  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC', [session.userId]);
    return res.status(200).json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    return res.status(500).json({
      error: 'Error interno al obtener los pedidos',
      details: error.message,
    });
  }
}
