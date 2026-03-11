const middleware = require('../../../lib/middleware.js');
const security = require('../../../lib/security.js');
import db from '../../../lib/db';

export default async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const { id } = req.query;
  const method = req.method;

  // Valida ID
  if (!id || typeof id !== 'string' || id.length > 50) {
    return middleware.sendBadRequest(res, 'ID inválido');
  }

  try {
    // GET - obtener una carta específica
    if (method === 'GET') {
      const [cardRows] = await db.query('SELECT * FROM cards WHERE id = ?', [id]);
      const card = cardRows[0];
      if (!card) {
        return middleware.sendNotFound(res, 'Carta no encontrada');
      }
      return middleware.sendSuccess(res, card);
    }

    // PUT y DELETE requieren autenticación
    if (method === 'PUT' || method === 'DELETE') {
      const session = await middleware.requireAuth(req, res);
      if (!session) {
        return middleware.sendUnauthorized(res, 'Requiere autenticación');
      }

      // Verificar que la carta existe
      const [existingRows] = await db.query('SELECT * FROM cards WHERE id = ?', [id]);
      const existingCard = existingRows[0];
      if (!existingCard) {
        return middleware.sendNotFound(res, 'Carta no encontrada');
      }

      if (method === 'PUT') {
        const { name, set, price, rarity, stock, image } = req.body;

        // Valida solo los campos que se actualizan
        if (name && !security.validateCardName(name)) {
          return middleware.sendBadRequest(res, 'Nombre inválido');
        }

        if (set && !security.validateSet(set)) {
          return middleware.sendBadRequest(res, 'Set inválido');
        }

        if (price !== undefined && !security.validatePrice(price)) {
          return middleware.sendBadRequest(res, 'Precio inválido');
        }

        if (rarity && !security.validateRarity(rarity)) {
          return middleware.sendBadRequest(res, 'Rareza inválida');
        }

        // Construir objeto de actualización
        const updateData = {};
        if (name) updateData.name = security.sanitizeText(name, 100);
        if (set) updateData.set = security.sanitizeText(set, 100);
        if (price !== undefined) updateData.price = parseFloat(price);
        if (rarity) updateData.rarity = rarity;
        if (stock !== undefined) updateData.stock = parseInt(stock, 10);
        if (image) updateData.image = image;

        await db.query('UPDATE cards SET ? WHERE id = ?', [updateData, id]);
        const [updatedRows] = await db.query('SELECT * FROM cards WHERE id = ?', [id]);
        const updatedCard = updatedRows[0];

        middleware.logSecurityEvent('CARD_UPDATED', {
          username: session.username,
          cardId: id,
        });

        return middleware.sendSuccess(res, updatedCard);
      }

      if (method === 'DELETE') {
        await db.query('DELETE FROM cards WHERE id = ?', [id]);

        middleware.logSecurityEvent('CARD_DELETED', {
          username: session.username,
          cardId: id,
          cardName: existingCard.name,
        });

        return middleware.sendSuccess(res, { ok: true, removed: existingCard });
      }
    }

    return middleware.sendMethodNotAllowed(res, ['GET', 'PUT', 'DELETE']);
  } catch (error) {
    middleware.logSecurityEvent('CARD_ID_ERROR', { error: error.message, cardId: id });
    return middleware.sendServerError(res, 'Error procesando solicitud');
  }
}

