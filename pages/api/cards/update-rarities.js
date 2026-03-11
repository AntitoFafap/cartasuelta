const db = require('../../../lib/db').default || require('../../../lib/db');
const { requireAuth } = require('../../../lib/middleware');

// Mapeo de rarezas de TCGdex (inglés) a español
function mapRarityToSpanish(rarity) {
  if (!rarity) return 'Unknown';
  
  const rarityLower = rarity.toLowerCase();
  
  // Rarezas secretas y especiales
  if (rarityLower.includes('secret') || 
      rarityLower.includes('hyper') || 
      rarityLower.includes('gold') ||
      rarityLower.includes('special art') ||
      rarityLower.includes('special illustration')) {
    return 'Secreto Raro';
  }
  
  // Ultra raros (V, VMAX, VSTAR, ex, etc.)
  if (rarityLower.includes('ultra') || 
      rarityLower.includes('vmax') || 
      rarityLower.includes('vstar') ||
      rarityLower.includes('full art') ||
      rarityLower.includes('illustration rare') ||
      /\bv\b/.test(rarityLower) ||
      rarityLower.includes(' ex')) {
    return 'Ultra Raro';
  }
  
  // Raros holográficos
  if (rarityLower.includes('holo') || 
      rarityLower.includes('double rare') ||
      rarityLower.includes('amazing')) {
    return 'Raro';
  }
  
  // Rare sin holo
  if (rarityLower.includes('rare')) {
    return 'Raro';
  }
  
  // Poco comunes
  if (rarityLower.includes('uncommon')) {
    return 'Poco Común';
  }
  
  // Comunes
  if (rarityLower.includes('common')) {
    return 'Común';
  }
  
  return rarity; // Si no hay match, devolver original
}

// Extraer el ID correcto de TCGdex desde tcgdexId mal formado
function extractCorrectTcgdexId(tcgdexId) {
  if (!tcgdexId) return null;
  
  // Si tiene formato "sv02-269-sv02", extraer "sv02-269"
  const parts = tcgdexId.split('-');
  if (parts.length >= 2) {
    // Detectar si el último segmento es repetición del set
    const lastPart = parts[parts.length - 1];
    const firstPart = parts[0];
    
    // Si el último parte parece ser un setId (ej: sv02, swsh1)
    if (/^[a-z]+\d+$/i.test(lastPart) && firstPart === lastPart) {
      // Quitar el último segmento
      return parts.slice(0, -1).join('-');
    }
  }
  
  return tcgdexId;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify auth
  const user = await requireAuth(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const allowedRoles = ['superadmin', 'moderator'];
  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    console.log('[UPDATE-RARITIES] Starting rarity update...');
    // Obtener todas las cartas desde MySQL
    const [cards] = await db.query('SELECT * FROM cards');
    let updated = 0;
    let failed = 0;

    for (const card of cards) {
      // Solo actualizar si la rareza es Unknown
      if (card.rarity && card.rarity !== 'Unknown') {
        continue;
      }

      // Intentar obtener el ID correcto
      const correctId = extractCorrectTcgdexId(card.tcgdexId);
      if (!correctId) {
        console.log(`[UPDATE-RARITIES] No tcgdexId for card: ${card.name}`);
        failed++;
        continue;
      }

      console.log(`[UPDATE-RARITIES] Fetching rarity for ${card.name} (ID: ${correctId})`);

      try {
        const response = await fetch(`https://api.tcgdex.net/v2/en/cards/${correctId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.rarity) {
            const mappedRarity = mapRarityToSpanish(data.rarity);
            // Actualizar en MySQL
            await db.query('UPDATE cards SET rarity = ?, tcgdexId = ? WHERE id = ?', [mappedRarity, correctId, card.id]);
            console.log(`[UPDATE-RARITIES] Updated ${card.name}: ${data.rarity} -> ${mappedRarity}`);
            updated++;
          } else {
            console.log(`[UPDATE-RARITIES] No rarity found for ${card.name}`);
            failed++;
          }
        } else {
          console.log(`[UPDATE-RARITIES] API error for ${card.name}: ${response.status}`);
          failed++;
        }
      } catch (e) {
        console.log(`[UPDATE-RARITIES] Fetch error for ${card.name}: ${e.message}`);
        failed++;
      }

      // Pequeña pausa para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    console.log(`[UPDATE-RARITIES] Complete. Updated: ${updated}, Failed: ${failed}`);
    return res.status(200).json({ 
      success: true, 
      updated, 
      failed,
      message: `Actualizadas ${updated} cartas, ${failed} fallaron` 
    });
  } catch (e) {
    console.error('[UPDATE-RARITIES] Error:', e);
    return res.status(500).json({ error: e.message });
  }
}
