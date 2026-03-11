const middleware = require('../../../lib/middleware.js');
const security = require('../../../lib/security.js');
import db from '../../../lib/db';

// Cache en memoria para reducir llamadas a DynamoDB
let cardsCache = null;
let cardsCacheTime = 0;
const CACHE_DURATION = 30000; // 30 segundos

async function getCards() {
  try {
    const now = Date.now();
    
    // Si el cache es válido, devolverlo
    if (cardsCache && (now - cardsCacheTime) < CACHE_DURATION) {
      return cardsCache;
    }
    
    // Leer de MySQL y cachear
    const [rows] = await db.query('SELECT * FROM cards');
    cardsCache = rows;
    cardsCacheTime = now;
    return cardsCache;
  } catch (e) {
    console.error('Error leyendo cartas de DynamoDB:', e);
    return [];
  }
}

function invalidateCache() {
  cardsCache = null;
  cardsCacheTime = 0;
}

export default async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const method = req.method;

  try {
    if (method === 'GET') {
      // Agregar headers de cache para el navegador
      res.setHeader('Cache-Control', 'public, max-age=30');
      const cards = await getCards();
      return middleware.sendSuccess(res, cards);
    }

    if (method === 'POST') {
      // POST requiere autenticación
      const cookies = req.headers.cookie || '';
      console.log('POST /api/cards - Headers cookies:', cookies);
      
      const session = await middleware.requireAuth(req, res);
      if (!session) {
        console.error('POST /api/cards - Auth failed: No session found');
        return middleware.sendUnauthorized(res, 'Requiere autenticación');
      }
      
      console.log('POST /api/cards - Auth success, user:', session.username);

      // Valida datos
      const { name, set, price, rarity, language, imageUrl, image, stock, cardType } = req.body;
      console.log('Received POST /api/cards:', { name, set, price, rarity, language, imageUrl, image, stock, cardType });

      if (!security.validateCardName(name)) {
        return middleware.sendBadRequest(res, 'Nombre de carta inválido (2-100 caracteres)');
      }

      if (!security.validateSet(set)) {
        return middleware.sendBadRequest(res, 'Set/Colección inválida (2-100 caracteres)');
      }

      if (!security.validatePrice(price)) {
        return middleware.sendBadRequest(res, 'Precio inválido (0-999999.99)');
      }

      if (rarity && !security.validateRarity(rarity)) {
        return middleware.sendBadRequest(res, 'Rareza no válida');
      }

      // Validar stock opcional
      const numStock = stock !== '' && stock !== null && stock !== undefined ? parseInt(stock, 10) : 0;
      if (isNaN(numStock) || numStock < 0) {
        return middleware.sendBadRequest(res, 'Stock debe ser un número válido (0 o mayor)');
      }

      // Validar idioma opcional
      const validLanguages = ['Español', 'Inglés', 'Japonés', 'Francés', 'Alemán', 'Italiano', 'Portugués'];
      const lang = language || 'Español';
      if (!validLanguages.includes(lang)) {
        return middleware.sendBadRequest(res, 'Idioma no válido');
      }

      // Validar tipo de carta
      const validCardTypes = ['Pokémon', 'Partidario'];
      const type = cardType || 'Pokémon';
      if (!validCardTypes.includes(type)) {
        return middleware.sendBadRequest(res, 'Tipo de carta no válido (Pokémon o Partidario)');
      }

      // Validar URL de imagen opcional (aceptamos `imageUrl` o `image`)
      let sanitizedImage = null;
      const providedImage = imageUrl || image || null;
      if (providedImage) {
        console.log('Validating image URL:', providedImage);
        if (!security.validateImageUrl(providedImage)) {
          console.error('Invalid image URL:', providedImage);
          return middleware.sendBadRequest(res, 'URL de imagen no válida. Usa: https://ejemplo.com/imagen.jpg');
        }
        sanitizedImage = security.sanitizeUrl(providedImage, 2048);
        console.log('Image URL validated and sanitized:', sanitizedImage);
      }

      try {
        console.log('Creating card in DynamoDB...');

        const [result] = await db.query(
          'INSERT INTO cards (name, `set`, price, rarity, language, imageUrl, stock, cardType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            security.sanitizeText(name, 100),
            security.sanitizeText(set, 100),
            parseFloat(price),
            rarity || 'Común',
            language,
            sanitizedImage,
            numStock,
            type,
          ]
        );
        const [newCardRows] = await db.query('SELECT * FROM cards WHERE id = ?', [result.insertId]);
        
        console.log('Card created in DynamoDB:', newCard);
        
        // Invalidar cache
        invalidateCache();

        middleware.logSecurityEvent('CARD_CREATED', {
          username: session.username,
          cardId: newCard.id,
        });

        return middleware.sendSuccess(res, newCard, 201);
      } catch (e) {
        console.error('Error creating card:', e.message);
        console.error('Error stack:', e.stack);
        middleware.logSecurityEvent('CARD_POST_ERROR', { error: e.message, stack: e.stack });
        return middleware.sendServerError(res, 'Error procesando solicitud: ' + e.message);
      }
    }

    return middleware.sendMethodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    middleware.logSecurityEvent('CARDS_INDEX_ERROR', { error: error.message });
    return middleware.sendServerError(res, 'Error procesando solicitud');
  }
}

