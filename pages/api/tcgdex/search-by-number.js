// Search for cards by set code and card number
export default async function handler(req, res) {
  const { set, number, lang = 'en' } = req.query;

  // Idiomas soportados por TCGdex
  const supportedLangs = ['en', 'es', 'fr', 'de', 'it', 'pt'];
  const searchLang = supportedLangs.includes(lang) ? lang : 'en';

  if (!set || !number) {
    return res.status(400).json({ error: 'Set code and card number are required' });
  }

  // Mapeo de códigos comunes de sets a IDs de TCGdex
  const setCodeMap = {
    // Scarlet & Violet Era
    'SVI': 'sv01',
    'PAL': 'sv02',
    'OBF': 'sv03',
    'MEW': 'sv03.5',
    '151': 'sv03.5',
    'PAR': 'sv04',
    'PAF': 'sv04.5',
    'TEF': 'sv05',
    'TWM': 'sv06',
    'SFA': 'sv06.5',
    'SCR': 'sv07',
    'SSP': 'sv08',
    'PRE': 'sv08.5',
    'JTG': 'sv09',
    'SVP': 'svp',
    // Sword & Shield Era
    'SWSH': 'swsh1',
    'SSH': 'swsh1',
    'RCL': 'swsh2',
    'DAA': 'swsh3',
    'VIV': 'swsh4',
    'BST': 'swsh5',
    'CRE': 'swsh6',
    'EVS': 'swsh7',
    'FST': 'swsh8',
    'BRS': 'swsh9',
    'ASR': 'swsh10',
    'LOR': 'swsh11',
    'SIT': 'swsh12',
    'CRZ': 'swsh12.5',
    // Sun & Moon Era
    'SUM': 'sm1',
    'SM1': 'sm1',
    'GRI': 'sm2',
    'SM2': 'sm2',
    'BUS': 'sm3',
    'SM3': 'sm3',
    'SLG': 'sm35',
    'CIN': 'sm4',
    'SM4': 'sm4',
    'UPR': 'sm5',
    'SM5': 'sm5',
    'FLI': 'sm6',
    'SM6': 'sm6',
    'CES': 'sm7',
    'SM7': 'sm7',
    'LOT': 'sm8',
    'SM8': 'sm8',
    'TEU': 'sm9',
    'SM9': 'sm9',
    'UNB': 'sm10',
    'SM10': 'sm10',
    'UNM': 'sm11',
    'SM11': 'sm11',
    'CEC': 'sm12',
    'SM12': 'sm12',
    // XY Era
    'XY': 'xy1',
    'XY1': 'xy1',
    'FLF': 'xy2',
    'XY2': 'xy2',
    'FFI': 'xy3',
    'XY3': 'xy3',
    'PHF': 'xy4',
    'XY4': 'xy4',
    'PRC': 'xy5',
    'XY5': 'xy5',
    'ROS': 'xy6',
    'XY6': 'xy6',
    'AOR': 'xy7',
    'XY7': 'xy7',
    'BKT': 'xy8',
    'XY8': 'xy8',
    'BKP': 'xy9',
    'XY9': 'xy9',
    'FCO': 'xy10',
    'XY10': 'xy10',
    'STS': 'xy11',
    'XY11': 'xy11',
    'EVO': 'xy12',
    'XY12': 'xy12',
  };

  async function fetchCardByLang(langToTry) {
    // Normalizar el código del set (mayúsculas, sin espacios)
    const normalizedSetCode = set.toUpperCase().trim();
    let tcgdexSetId = setCodeMap[normalizedSetCode];
    if (!tcgdexSetId) {
      tcgdexSetId = normalizedSetCode.toLowerCase();
    }
    const cardNumber = number.split('/')[0].trim().padStart(3, '0');
    const cardNumberAlt = number.split('/')[0].trim();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const setUrl = `https://api.tcgdex.net/v2/${langToTry}/sets/${tcgdexSetId}`;
      const setRes = await fetch(setUrl, { signal: controller.signal });
      if (!setRes.ok) {
        clearTimeout(timeoutId);
        return { found: false, results: [], setData: null, tcgdexSetId };
      }
      const setData = await setRes.json();
      const cards = setData.cards || [];
      const matchingCards = cards.filter(card => {
        const cardLocalId = String(card.localId || '');
        return cardLocalId === cardNumber || 
               cardLocalId === cardNumberAlt ||
               cardLocalId.padStart(3, '0') === cardNumber;
      });
      clearTimeout(timeoutId);
      if (matchingCards.length === 0) {
        return { found: false, results: [], setData, tcgdexSetId };
      }
      const results = matchingCards.map(card => {
        let imageUrl = null;
        if (card.image) {
          imageUrl = card.image.endsWith('.png') ? card.image : `${card.image}/high.png`;
        }
        return {
          id: card.id,
          name: card.name,
          cardId: card.id,
          localId: card.localId,
          image: imageUrl,
          rarity: card.rarity || 'Unknown',
          category: card.category || 'Pokémon',
          types: card.types || [],
          set: {
            name: setData.name || tcgdexSetId,
            id: tcgdexSetId
          }
        };
      });
      return { found: true, results };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return { found: false, results: [] };
    }
  }

  try {
    // 1. Buscar en el idioma solicitado
    let { found, results } = await fetchCardByLang(searchLang);

    // 2. Si no hay resultados y el idioma no es inglés, buscar en inglés
    if (!found && searchLang !== 'en') {
      ({ found, results } = await fetchCardByLang('en'));
    }

    if (!found) {
      return res.status(200).json({ error: `Carta #${number} no encontrada en el set ${set}`, results: [] });
    }

    return res.status(200).json({ results });
  } catch (e) {
    console.error('[SEARCH-BY-NUMBER Error]:', e.message);
    return res.status(200).json({ error: 'Error en la búsqueda', results: [] });
  }
}
