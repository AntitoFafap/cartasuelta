const { requireAuth } = require('../../../lib/middleware');
import db from '../../../lib/db';
import { getCache, setCache, invalidateCache } from '../../../lib/inventoryCache';

async function getInventory() {
  try {
    const cached = getCache();
    if (cached) {
      return cached;
    }
    
    const [data] = await db.query('SELECT * FROM cardInventory');
    setCache(data);
    return data;
  } catch (e) {
    console.error('Error leyendo inventario de DynamoDB:', e);
    return [];
  }
}

// Mapear idiomas del frontend a los valores del enum de DynamoDB
const LANGUAGE_MAP = {
  'Español': 'Espanol',
  'Inglés': 'Ingles',
  'Japonés': 'Japones',
  'Francés': 'Frances',
  'Alemán': 'Aleman',
  'Italiano': 'Italiano',
  'Portugués': 'Portugues',
  'Chino': 'Chino'
};

// Mapear condiciones del frontend a los valores del enum de DynamoDB
const CONDITION_MAP = {
  'Mint': 'Mint',
  'Near Mint': 'NearMint',
  'Lightly Played': 'LightlyPlayed',
  'Moderately Played': 'ModeratelyPlayed',
  'Heavily Played': 'HeavilyPlayed',
  'Damaged': 'Damaged'
};

const handler = async (req, res) => {
    // Fix para Next.js local: parsear body si viene como string
    if (req.method === 'POST' && typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }
  // Middleware de autenticación para POST
  if (req.method === 'POST') {
    const session = await requireAuth(req, res);
    
    if (!session) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { name, set, cardNumber, imageUrl, price, stock, language, condition, cardType, tcgdexId, description, rarity } = req.body;

    // Validaciones
    if (!name || !set || !imageUrl || !price || stock === undefined) {
      return res.status(400).json({ error: 'Campos requeridos: name, set, imageUrl, price, stock' });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número positivo' });
    }

    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ error: 'El stock debe ser un número no negativo' });
    }

    if (!imageUrl.startsWith('http')) {
      return res.status(400).json({ error: 'La URL de imagen debe ser un enlace válido (http/https)' });
    }

    try {
      // Mapear idioma y condición a los valores del enum
      const mappedLanguage = LANGUAGE_MAP[language] || 'Espanol';
      const mappedCondition = CONDITION_MAP[condition] || 'LightlyPlayed';

      const [result] = await db.query(
        'INSERT INTO cardInventory (name, set, cardNumber, imageUrl, price, stock, language, `condition`, cardType, tcgdexId, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          name.trim(),
          set.trim(),
          cardNumber?.trim() || null,
          imageUrl.trim(),
          parseFloat(price),
          parseInt(stock),
          mappedLanguage,
          mappedCondition,
          cardType?.trim() || 'Pokémon',
          tcgdexId?.trim() || null,
          rarity?.trim() || description?.trim() || null
        ]
      );
      const [newCardRows] = await db.query('SELECT * FROM cardInventory WHERE id = ?', [result.insertId]);
      const newCard = newCardRows[0];

      // Invalidar cache
      invalidateCache();

      return res.status(201).json(newCard);
    } catch (e) {
      console.error('Error creando item en DynamoDB:', e);
      return res.status(500).json({ error: 'Error guardando inventario: ' + e.message });
    }
  } 
  else if (req.method === 'GET') {
    // GET es público (con caché)
    try {
      const inventory = await getInventory();
      res.setHeader('Cache-Control', 'public, max-age=30');
      return res.status(200).json(inventory);
    } catch (e) {
      console.error('Error obteniendo inventario:', e);
      return res.status(500).json({ error: 'Error obteniendo inventario' });
    }
  } 
  else {
    return res.status(405).json({ error: 'Método no permitido' });
  }
};

export default handler;
