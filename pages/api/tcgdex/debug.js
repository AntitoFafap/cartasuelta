// Debug endpoint to check TCGdex API structure
export default async function handler(req, res) {
  try {
    // Try different endpoints
    const endpoints = [
      'https://api.tcgdex.net/v2/en/sets',
      'https://api.tcgdex.net/v2/pokemon/sets',
      'https://api.tcgdex.net/v2/pokemon/en/sets',
    ];

    const results = {};

    for (const endpoint of endpoints) {
      try {
        console.log('Trying:', endpoint);
        const res = await fetch(endpoint, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const data = await res.json();
        results[endpoint] = {
          status: res.status,
          isArray: Array.isArray(data),
          type: typeof data,
          keys: Object.keys(data).slice(0, 5),
          length: Array.isArray(data) ? data.length : 'N/A',
          firstItem: Array.isArray(data) ? data[0] : Object.values(data)[0],
        };
      } catch (e) {
        results[endpoint] = { error: e.message };
      }
    }

    return res.status(200).json({ endpoints: results });
  } catch (error) {
    res.status(200).json({ error: error.message });
  }
}

