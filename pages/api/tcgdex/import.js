const db = require('../../../lib/db').default || require('../../../lib/db');
const { requireAuth } = require('../../../lib/middleware');

// Mapeo de rarezas de TCGdex (inglés) a español
function mapRarityToSpanish(rarity) {
  if (!rarity || rarity === 'None' || rarity === 'Unknown' || rarity === 'null') {
    return 'Sin Categoría';
  }
  
  const rarityLower = rarity.toLowerCase();
  
  if (rarityLower.includes('secret') || 
      rarityLower.includes('hyper') || 
      rarityLower.includes('gold') ||
      rarityLower.includes('special art')) {
    return 'Secreto Raro';
  }
  
  // Ultra raros (V, VMAX, VSTAR, ex, etc.)
  if (rarityLower.includes('ultra') || 
      rarityLower.includes('vmax') || 
      rarityLower.includes('vstar') ||
      rarityLower.includes('full art') ||
      rarityLower.includes('illustration rare') ||
      rarityLower.includes('special illustration') ||
      /\bv\b/.test(rarityLower) ||
      rarityLower.includes(' ex')) {
    return 'Ultra Raro';
  }
  
  // Raros holográficos
  if (rarityLower.includes('holo') || 
      rarityLower.includes('rare') ||
      rarityLower.includes('double rare') ||
      rarityLower.includes('amazing')) {
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
  
  return 'Sin Categoría'; // Si no hay match, devolver sin categoría
}

// Mapear idiomas del frontend a los valores del enum de DynamoDB
const LANGUAGE_MAP = {
  'Spanish': 'Espanol',
  'Español': 'Espanol',
  'English': 'Ingles',
  'Inglés': 'Ingles',
  'Japanese': 'Japones',
  'Japonés': 'Japones',
  'French': 'Frances',
  'Francés': 'Frances',
  'German': 'Aleman',
  'Alemán': 'Aleman',
  'Italian': 'Italiano',
  'Italiano': 'Italiano',
  'Portuguese': 'Portugues',
  'Portugués': 'Portugues',
  'Chinese': 'Chino',
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

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[IMPORT] Received POST request');

    // Verify auth
    const user = await requireAuth(req, res);
    console.log('[IMPORT] Auth result:', user ? `User: ${user.username}` : 'No user');

    if (!user) {
      console.log('[IMPORT] Auth failed - no user');
      return res.status(401).json({ error: 'Unauthorized - no session' });
    }
    
    // Verificar roles válidos: superadmin o moderator pueden importar
    const allowedRoles = ['superadmin', 'moderator'];
    if (!allowedRoles.includes(user.role)) {
      console.log('[IMPORT] Auth failed - user role is', user.role);
      return res.status(403).json({ error: 'Forbidden - admin role required' });
    }

    console.log('[IMPORT] Auth OK for user:', user.username);

    const {
      tcgdexId,
      name,
      set,
      setId,
      number,
      rarity,
      image,
      price,
      stock,
      cardType,
      supporterFinish,
      language,
      condition,
      profit,
    } = req.body;

    if (!name || !set || !price) {
      return res.status(400).json({ error: 'Name, set, and price are required' });
    }

    console.log('[IMPORT] Request body:', { ...req.body, image: '[...image url...]' });
    
    // Fetch full card data from TCGdex to get rarity, hp, types, etc.
    let fullCardData = {};
    if (tcgdexId) {
      try {
        const cardRes = await fetch(`https://api.tcgdex.net/v2/en/cards/${tcgdexId}`);
        if (cardRes.ok) {
          fullCardData = await cardRes.json();
        }
      } catch (e) {
        console.log('[IMPORT] Could not fetch full card data from TCGdex:', e.message);
      }
    }

    // Validate and safely convert numeric values
    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10) || 0;

    console.log('[IMPORT] Validation: price=', priceNum, 'stock=', stockNum);

    if (isNaN(priceNum)) {
      return res.status(400).json({ error: 'Price must be a valid number' });
    }

    // Obtener rareza y mapearla al español
    const rawRarity = fullCardData.rarity || rarity || 'Unknown';
        const newCard = { id: 1, ...item }; // Placeholder for the new card
        await db.query(
          'INSERT INTO inventory (name, setName, rarity, tcgdexId, stock, price) VALUES (?, ?, ?, ?, ?, ?)',
          [
            fullCardData.name || name,
            setName,
            mappedRarity,
            tcgdexId || null,
            stockNum,
            priceNum
          ]
        );
    console.log('[IMPORT] Rarity mapping:', rawRarity, '->', mappedRarity);

    // Obtener nombre del set - preferir datos de TCGdex si están disponibles
    let setName = set;
    if (fullCardData.set) {
      if (typeof fullCardData.set === 'string') {
        setName = fullCardData.set;
      } else if (fullCardData.set.name) {
        setName = fullCardData.set.name;
      }
    }
    console.log('[IMPORT] Set name:', setName);

    // Mapear idioma y condición para DynamoDB
    const mappedLanguage = LANGUAGE_MAP[language] || 'Espanol';
    const mappedCondition = CONDITION_MAP[condition] || 'NearMint';

    try {
      const newCard = await createInventoryItem({
        name: fullCardData.name || name,
        set: setName,
        cardNumber: fullCardData.localId || number || null,
        imageUrl: image || fullCardData.image,
        price: priceNum,
        stock: stockNum,
        rarity: mappedRarity,
        language: mappedLanguage,
        condition: mappedCondition,
        cardType: cardType || fullCardData.category || 'Pokémon',
        tcgdexId: tcgdexId || null,
        description: fullCardData.description || null,
      });

      console.log('[IMPORT] Card saved to DynamoDB:', newCard.id);
      res.status(201).json(newCard);
    } catch (dbError) {
      console.error('[IMPORT] Error saving to DynamoDB:', dbError);
      return res.status(500).json({ error: 'Failed to save card to database: ' + dbError.message });
    }
  } catch (error) {
    console.error('[IMPORT] Unexpected error:', error);
    res.status(500).json({ error: 'Failed to import card: ' + error.message });
  }
}
