// Get all cards from a specific set
export default async function handler(req, res) {
  const { setId } = req.query;

  if (!setId) {
    return res.status(400).json({ error: 'Set ID is required' });
  }

  try {
    // Get the set with all its cards
    const response = await fetch(`https://api.tcgdex.net/v2/en/sets/${setId}`);
    
    if (!response.ok) {
      return res.status(404).json({ error: 'Set not found' });
    }

    const setData = await response.json();
    
    // Cards are in an object with numeric keys, convert to array
    const cardsObj = setData.cards || {};
    const cards = Object.values(cardsObj);

    const formattedCards = cards.map(card => {
      // Handle image - TCGdex returns base URL, we need to add /high.png
      let imageUrl = null;
      if (typeof card.image === 'string') {
        // TCGdex image format: base URL + /high.png for better quality
        imageUrl = card.image.endsWith('.png') ? card.image : card.image + '/high.png';
      } else if (typeof card.image === 'object' && card.image) {
        imageUrl = card.image.small || card.image.large;
      } else if (card.localId) {
        // Construir URL manualmente si no viene imagen
        imageUrl = `https://assets.tcgdex.net/en/${setId}/${card.localId}/high.png`;
      }

      return {
        id: card.id,
        name: card.name,
        setId: setId,
        number: card.localId || 'N/A',
        image: imageUrl,
        hp: null,
        types: [],
        stage: null,
      };
    });

    res.status(200).json(formattedCards);
  } catch (error) {
    console.error('TCGdex set cards error:', error);
    res.status(500).json({ error: 'Failed to fetch cards from set' });
  }
}
