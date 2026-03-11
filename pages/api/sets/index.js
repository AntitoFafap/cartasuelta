const middleware = require('../../../lib/middleware.js');

// Cache en memoria
let setsCache = null;
let setCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minuto

async function fetchSetsFromTCGdex() {
  try {
    const now = Date.now();
    
    // Si el cache es válido, devolverlo
    if (setsCache && (now - setCacheTime) < CACHE_DURATION) {
      return setsCache;
    }
    
    const response = await fetch('https://api.tcgdex.net/v2/en/sets');
    if (!response.ok) {
      throw new Error('Failed to fetch sets from TCGdex');
    }
    
    const sets = await response.json();

    // Filter out Pokémon TCG Pocket sets
    const filteredSets = sets.filter(set => {
      const isPocketSet = /^[AB]\d/.test(set.id) || set.id.startsWith('P-A') || set.id.startsWith('mep') || set.id.startsWith('me');
      return !isPocketSet;
    });

    // Get unique set names
    const setNames = [...new Set(filteredSets.map(s => s.name))].sort();
    
    setsCache = setNames;
    setCacheTime = now;
    return setNames;
  } catch (e) {
    console.error('Error fetching sets from TCGdex:', e);
    return setsCache || [];
  }
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const method = req.method;

  try {
    if (method === 'GET') {
      res.setHeader('Cache-Control', 'private, max-age=60');
      const sets = await fetchSetsFromTCGdex();
      return middleware.sendSuccess(res, sets);
    }

    return middleware.sendMethodNotAllowed(res, ['GET']);
  } catch (error) {
    middleware.logSecurityEvent('SETS_INDEX_ERROR', { error: error.message });
    return middleware.sendServerError(res, 'Error procesando solicitud');
  }
}
