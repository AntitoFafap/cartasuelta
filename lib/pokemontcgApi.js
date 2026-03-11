// pages/api/tcgdex/search.js
// Búsqueda de cartas en TCGdex API - Versión corregida

export default async function handler(req, res) {
  const { q, lang = 'en' } = req.query;

  // --- Modo debug: muestra respuesta cruda de la API ---
  if (req.query.debug === '1') {
    try {
      const testUrl = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(q)}`;
      const r = await fetch(testUrl);
      const data = await r.json();
      return res.status(200).json({ url: testUrl, status: r.status, raw: data });
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  // --- Validación básica ---
  if (!q || q.trim().length < 1) {
    return res.status(400).json({ error: 'Query must be at least 1 character' });
  }

  const supportedLangs = ['en', 'es', 'fr', 'de', 'it', 'pt'];
  const searchLang = supportedLangs.includes(lang) ? lang : 'en';

  // --- Normalizar texto (quitar acentos) ---
  const normalize = (text) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s']/g, '')
      .trim();

  // --- Generar variantes del query ---
  const generateSearchVariants = (query) => {
    const q = query.trim();
    const variants = new Set();

    // Query original y normalizado
    variants.add(q);
    variants.add(normalize(q));

    // Capitalizar primera letra
    const capitalized = q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();
    variants.add(capitalized);

    // Todo en minúsculas y mayúsculas
    variants.add(q.toLowerCase());
    variants.add(q.toUpperCase());

    // Manejo de "poké" / "poke"
    if (q.toLowerCase().includes('poke')) {
      variants.add(q.replace(/poke/gi, 'Poké'));
      variants.add(q.replace(/poke/gi, 'poké'));
    }
    if (q.toLowerCase().includes('poké')) {
      variants.add(q.replace(/poké/gi, 'Poke'));
      variants.add(q.replace(/poké/gi, 'poke'));
    }

    // Manejo de posesivos (erikas -> erika's)
    if (!q.includes("'")) {
      const words = q.split(' ');
      const possessiveWords = words.map(word => {
        if (word.toLowerCase().endsWith('s') && word.length > 2) {
          return word.slice(0, -1) + "'s";
        }
        return word;
      });
      variants.add(possessiveWords.join(' '));
    }

    // Manejo de posesivos inverso (erika's -> erikas)
    if (q.includes("'s")) {
      variants.add(q.replace(/'s/g, 's'));
      variants.add(q.replace(/'s/g, ''));
    }

    // Patrón "X de Y" → "Y's X"
    const dePattern = /^(.*) de ([^ ]+)$/i;
    const deMatch = q.match(dePattern);
    if (deMatch) {
      const card = deMatch[1].trim();
      const owner = deMatch[2].trim();
      const ownerCap = owner.charAt(0).toUpperCase() + owner.slice(1);
      const cardCap = card.charAt(0).toUpperCase() + card.slice(1);
      variants.add(`${ownerCap}'s ${cardCap}`);
      variants.add(`${ownerCap} ${cardCap}`);
    }

    // Limitar a 10 variantes únicas y no vacías
    return [...variants].filter(v => v.length > 0).slice(0, 10);
  };

  // --- Función principal de búsqueda ---
  async function searchCards(langToUse) {
    const variants = generateSearchVariants(q);
    const allCards = new Map(); // Usamos Map para deduplicar por ID
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Buscar todas las variantes en paralelo
      const searchPromises = variants.map(async (variant) => {
        const url = `https://api.tcgdex.net/v2/${langToUse}/cards?name=${encodeURIComponent(variant)}`;
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) {
            const cards = await res.json();
            if (Array.isArray(cards)) return cards;
          }
        } catch (e) {
          // Ignorar errores individuales de variantes
        }
        return [];
      });

      const results = await Promise.allSettled(searchPromises);
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          result.value.forEach(card => {
            if (card?.id && !allCards.has(card.id)) {
              allCards.set(card.id, card);
            }
          });
        }
      });

    } finally {
      clearTimeout(timeoutId);
    }

    return [...allCards.values()];
  }

  // --- Detectar si el ID pertenece a TCG Pocket (excluir) ---
  const isPocketCard = (cardId = '') => {
    const setId = cardId.split('-')[0] || '';
    return (
      /^[AB]\d/.test(setId) ||
      setId.startsWith('P-A') ||
      setId.startsWith('PROMO-A') ||
      setId === 'me'
    );
  };

  // --- Formatear carta para la respuesta ---
  const formatCard = (card) => {
    const setId = card.id?.split('-')[0] || '';
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
      category: card.category || 'Unknown',
      types: card.types || [],
      set: {
        name: card.set?.name || setId,
        id: setId,
      },
    };
  };

  try {
    // 1. Buscar en el idioma solicitado
    let cards = await searchCards(searchLang);

    // 2. Si no hay resultados y no es inglés, intentar en inglés
    if (cards.length === 0 && searchLang !== 'en') {
      console.log(`[SEARCH] No results in "${searchLang}", trying English...`);
      cards = await searchCards('en');
    }

    if (cards.length === 0) {
      console.log(`[SEARCH] No cards found for: "${q}"`);
      return res.status(200).json([]);
    }

    // 3. Filtrar cartas de Pocket y formatear
    const filtered = cards
      .filter(card => !isPocketCard(card.id))
      .slice(0, 60)
      .map(formatCard);

    console.log(`[SEARCH] "${q}" → ${cards.length} found, ${filtered.length} after filtering`);
    return res.status(200).json(filtered);

  } catch (e) {
    console.error('[SEARCH Error]:', e.message);
    return res.status(500).json({ error: 'Error interno del servidor', detail: e.message });
  }
}