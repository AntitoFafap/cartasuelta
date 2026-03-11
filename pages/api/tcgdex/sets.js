// Get all available sets from TCGdex
export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.tcgdex.net/v2/en/sets');
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch sets' });
    }
    
    const sets = await response.json();

    // Filter out Pokémon TCG Pocket sets (the mobile game sets)
    const filteredSets = sets.filter(set => {
      const isPocketSet = /^[AB]\d/.test(set.id) || set.id.startsWith('P-A') || set.id.startsWith('mep') || set.id.startsWith('me');
      return !isPocketSet;
    });

    const formattedSets = filteredSets.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series || '',
      printedTotal: set.printedTotal || 0,
      total: set.total || 0,
      releaseDate: set.releaseDate || '',
      logo: set.logo || null,
    }));

    res.status(200).json(formattedSets);
  } catch (error) {
    console.error('TCGdex sets error:', error);
    res.status(500).json({ error: 'Failed to fetch TCGdex sets' });
  }
}
