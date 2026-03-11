const { requireAuth } = require('../../../lib/middleware');
import db from '../../../lib/db';
import { invalidateCache } from '../../../lib/inventoryCache';

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
  const { id } = req.query;

  // GET específico
  if (req.method === 'GET') {
    try {
      const [cardRows] = await db.query('SELECT * FROM cardInventory WHERE id = ?', [id]);
      const card = cardRows[0];
      
      if (!card) {
        return res.status(404).json({ error: 'Carta no encontrada' });
      }

      res.setHeader('Cache-Control', 'public, max-age=30');
      return res.status(200).json(card);
    } catch (e) {
      console.error('Error obteniendo item:', e);
      return res.status(500).json({ error: 'Error obteniendo carta' });
    }
  }
  // PUT actualizar
  else if (req.method === 'PUT') {
    const session = await requireAuth(req, res);
    
    if (!session) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Verificar que existe
    const [existingRows] = await db.query('SELECT * FROM cardInventory WHERE id = ?', [id]);
    const existingCard = existingRows[0];
    if (!existingCard) {
      return res.status(404).json({ error: 'Carta no encontrada' });
    }

    const { name, set, cardNumber, imageUrl, price, profit, stock, language, condition, cardType, description, rarity } = req.body;

    // Validaciones
    if (price !== undefined && (isNaN(price) || price <= 0)) {
      return res.status(400).json({ error: 'El precio debe ser un número positivo' });
    }

    if (profit !== undefined && (isNaN(profit) || profit < 0)) {
      return res.status(400).json({ error: 'La ganancia debe ser un número no negativo' });
    }

    if (stock !== undefined && (isNaN(stock) || stock < 0)) {
      return res.status(400).json({ error: 'El stock debe ser un número no negativo' });
    }

    if (imageUrl && !imageUrl.startsWith('http')) {
      return res.status(400).json({ error: 'La URL de imagen debe ser válida' });
    }

    // Construir objeto de actualización solo con campos proporcionados
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (set !== undefined) updateData.set = set.trim();
    if (cardNumber !== undefined) updateData.cardNumber = cardNumber?.trim() || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (profit !== undefined) updateData.profit = parseFloat(profit);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (rarity !== undefined) updateData.rarity = rarity.trim();
    if (language !== undefined) updateData.language = LANGUAGE_MAP[language] || language;
    if (condition !== undefined) updateData.condition = CONDITION_MAP[condition] || condition;
    if (cardType !== undefined) updateData.cardType = cardType.trim();
    if (description !== undefined) updateData.description = description.trim();

    try {
      await db.query('UPDATE cardInventory SET ? WHERE id = ?', [updateData, id]);
      invalidateCache(); // Limpiar cache después de actualizar
      const [updatedRows] = await db.query('SELECT * FROM cardInventory WHERE id = ?', [id]);
      return res.status(200).json(updatedRows[0]);
    } catch (e) {
      console.error('Error actualizando item:', e);
      return res.status(500).json({ error: 'Error actualizando inventario: ' + e.message });
    }
  }
  // DELETE eliminar
  else if (req.method === 'DELETE') {
    const session = await requireAuth(req, res);
    
    if (!session) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Verificar que existe
    const [existingRows] = await db.query('SELECT * FROM cardInventory WHERE id = ?', [id]);
    const existingCard = existingRows[0];
    if (!existingCard) {
      return res.status(404).json({ error: 'Carta no encontrada' });
    }

    try {
      await db.query('DELETE FROM cardInventory WHERE id = ?', [id]);
      invalidateCache(); // Limpiar cache después de eliminar
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('Error eliminando item:', e);
      return res.status(500).json({ error: 'Error eliminando carta: ' + e.message });
    }
  } 
  else {
    return res.status(405).json({ error: 'Método no permitido' });
  }
};

export default handler;
