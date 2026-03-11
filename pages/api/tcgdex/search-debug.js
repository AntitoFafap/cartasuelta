// Test what cards actually exist in TCGdex
export default async function handler(req, res) {
  try {
    // Get first set's cards directly from set endpoint
    const setRes = await fetch('https://api.tcgdex.net/v2/en/sets/base1');
    const setData = await setRes.json();

    console.log('Set data keys:', Object.keys(setData));
    console.log('Set data has cards?', 'cards' in setData);

    // If set has cards, check its structure
    let cardsFromSet = null;
    if (setData.cards) {
      console.log('Cards from set:', typeof setData.cards);
      cardsFromSet = setData.cards;
    }

    // Try the query endpoint with just set filter
    const queryRes = await fetch('https://api.tcgdex.net/v2/en/cards?q=set:base1');
    const queryData = await queryRes.json();

    console.log('Query response is array:', Array.isArray(queryData));
    console.log('Query data length:', Array.isArray(queryData) ? queryData.length : 'N/A');
    
    if (Array.isArray(queryData) && queryData.length > 0) {
      console.log('First card:', queryData[0]);
      console.log('Card keys:', Object.keys(queryData[0]));
    }

    return res.status(200).json({
      setHasCards: 'cards' in setData,
      setCardsType: setData.cards ? typeof setData.cards : 'N/A',
      setCardsKeys: setData.cards ? Object.keys(setData.cards).slice(0, 10) : null,
      queryIsArray: Array.isArray(queryData),
      queryLength: Array.isArray(queryData) ? queryData.length : 'N/A',
      sampleCard: Array.isArray(queryData) && queryData.length > 0 ? queryData[0] : null,
      setCardsSample: cardsFromSet ? Object.values(cardsFromSet)[0] : null,
    });
  } catch (error) {
    res.status(200).json({ error: error.message, stack: error.stack });
  }
}
