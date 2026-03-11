import React from 'react';

export default function InventorySearch({ onCardAdded, sets }) {
  const [searchType, setSearchType] = React.useState('name'); // 'name' o 'number'
  const [searchQuery, setSearchQuery] = React.useState('');
  const [setCode, setSetCode] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [searchLang, setSearchLang] = React.useState('en'); // Idioma de búsqueda
  const [searchResults, setSearchResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedCard, setSelectedCard] = React.useState(null);
  const [inventoryData, setInventoryData] = React.useState({
    price: '',
    stock: '',
    language: 'Español',
    condition: 'Lightly Played'
  });
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const searchLanguages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
  ];

  // Códigos de sets comunes para ayuda
  const commonSetCodes = [
    { code: 'SVI', name: 'Scarlet & Violet' },
    { code: 'PAL', name: 'Paldea Evolved' },
    { code: 'OBF', name: 'Obsidian Flames' },
    { code: '151', name: '151' },
    { code: 'PAR', name: 'Paradox Rift' },
    { code: 'PAF', name: 'Paldean Fates' },
    { code: 'TEF', name: 'Temporal Forces' },
    { code: 'TWM', name: 'Twilight Masquerade' },
    { code: 'SCR', name: 'Stellar Crown' },
    { code: 'SSP', name: 'Surging Sparks' },
    { code: 'SWSH', name: 'Sword & Shield' },
    { code: 'SUM', name: 'Sun & Moon' },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (searchType === 'name' && !searchQuery.trim()) return;
    if (searchType === 'number' && (!setCode.trim() || !cardNumber.trim())) return;

    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      
      let res;
      if (searchType === 'name') {
        res = await fetch(`/api/tcgdex/search?q=${encodeURIComponent(searchQuery)}&lang=${searchLang}`, {
          signal: controller.signal
        });
      } else {
        res = await fetch(`/api/tcgdex/search-by-number?set=${encodeURIComponent(setCode)}&number=${encodeURIComponent(cardNumber)}&lang=${searchLang}`, {
          signal: controller.signal
        });
      }
      clearTimeout(timeoutId);

      const data = await res.json();
      
      // Para búsqueda por número, el formato es { results: [...], error?: '...' }
      if (searchType === 'number') {
        if (data.error) {
          setError(data.error);
          setSearchResults([]);
        } else if (data.results && data.results.length > 0) {
          setSearchResults(data.results);
        } else {
          setError('No se encontró la carta');
          setSearchResults([]);
        }
      } else {
        // Para búsqueda por nombre
        if (Array.isArray(data) && data.length > 0) {
          setSearchResults(data);
        } else if (Array.isArray(data) && data.length === 0) {
          setError('No se encontraron cartas con ese nombre');
          setSearchResults([]);
        } else {
          setError('Error en la búsqueda. Intenta de nuevo.');
          setSearchResults([]);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('La búsqueda tardó demasiado. Intenta de nuevo.');
      } else {
        setError('Error buscando cartas: ' + err.message);
      }
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCard = async (card) => {
    setError('');
    setInventoryData({
      price: '',
      stock: '',
      language: searchLang === 'es' ? 'Español' : 'Inglés',
      condition: 'Lightly Played'
    });
    
    // Obtener información completa de la carta desde TCGdex
    try {
      const cardId = card.cardId || card.id.split('-')[0];
      console.log('[InventorySearch] Fetching card details for:', cardId);
      
      const res = await fetch(`https://api.tcgdex.net/v2/${searchLang}/cards/${cardId}`);
      if (res.ok) {
        const fullCardData = await res.json();
        console.log('[InventorySearch] Full card data:', fullCardData);
        
        // Combinar datos de búsqueda con datos completos
        setSelectedCard({
          ...card,
          rarity: fullCardData.rarity || card.rarity || 'Unknown',
          category: fullCardData.category || card.category || 'Pokémon',
          hp: fullCardData.hp,
          types: fullCardData.types,
          localId: fullCardData.localId || card.localId
        });
      } else {
        // Si falla, usar los datos que tenemos
        setSelectedCard(card);
      }
    } catch (e) {
      console.warn('[InventorySearch] Could not fetch full card data:', e.message);
      setSelectedCard(card);
    }
  };

  const handleInventoryChange = (e) => {
    const { name, value } = e.target;
    setInventoryData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddToInventory = async (e) => {
    e.preventDefault();
    setError('');

    if (!inventoryData.price || !inventoryData.stock) {
      setError('Precio y stock son requeridos');
      return;
    }

    if (isNaN(inventoryData.price) || inventoryData.price <= 0) {
      setError('Precio debe ser válido y mayor a 0');
      return;
    }

    if (isNaN(inventoryData.stock) || inventoryData.stock < 0) {
      setError('Stock debe ser válido y no negativo');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: selectedCard.name,
        set: selectedCard.set?.name || 'Unknown',
        cardNumber: selectedCard.localId || selectedCard.cardId,
        imageUrl: selectedCard.image,
        price: parseFloat(inventoryData.price),
        stock: parseInt(inventoryData.stock),
        language: inventoryData.language,
        condition: inventoryData.condition,
        cardType: selectedCard.category || selectedCard.cardType || 'Pokémon',
        rarity: selectedCard.rarity || 'Unknown',
        tcgdexId: selectedCard.cardId,
        description: selectedCard.description || ''
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error guardando en inventario');
      }

      const newCard = await res.json();
      onCardAdded(newCard);
      
      setSelectedCard(null);
      setSearchQuery('');
      setSearchResults([]);
      setInventoryData({
        price: '',
        stock: '',
        language: 'Español',
        condition: 'Lightly Played'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: {
      background: '#f8f9fa',
      padding: '30px',
      borderRadius: '10px',
      marginTop: '20px'
    },
    searchForm: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px'
    },
    searchInput: {
      flex: 1,
      padding: '12px',
      border: '2px solid #ddd',
      borderRadius: '5px',
      fontSize: '15px'
    },
    searchBtn: {
      padding: '12px 20px',
      background: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: 'bold',
      minWidth: '120px'
    },
    resultsList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    resultCard: {
      cursor: 'pointer',
      border: '2px solid #ddd',
      borderRadius: '5px',
      padding: '10px',
      transition: 'all 0.3s ease',
      textAlign: 'center'
    },
    resultCardImg: {
      width: '100%',
      height: '150px',
      objectFit: 'cover',
      borderRadius: '3px',
      marginBottom: '8px'
    },
    resultCardName: {
      fontSize: '12px',
      fontWeight: 'bold',
      marginBottom: '5px'
    },
    resultCardSet: {
      fontSize: '11px',
      color: '#666'
    },
    selectedContainer: {
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      gap: '30px',
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px'
    },
    selectedImage: {
      maxHeight: '300px',
      width: '100%',
      objectFit: 'contain',
      borderRadius: '5px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '15px'
    },
    label: {
      marginBottom: '5px',
      fontWeight: 'bold',
      color: '#333'
    },
    input: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontFamily: 'inherit'
    },
    select: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontFamily: 'inherit'
    },
    selectedInfo: {
      display: 'flex',
      flexDirection: 'column'
    },
    selectedTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    selectedMeta: {
      fontSize: '13px',
      color: '#666',
      marginBottom: '20px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px'
    },
    addBtn: {
      flex: 1,
      padding: '12px',
      background: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '15px'
    },
    cancelBtn: {
      flex: 1,
      padding: '12px',
      background: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '15px'
    },
    error: {
      color: '#d32f2f',
      padding: '10px',
      background: '#ffebee',
      borderRadius: '5px',
      marginBottom: '15px'
    },
    loading: {
      textAlign: 'center',
      padding: '20px',
      color: '#666'
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>🔍 Buscar Carta en TCGdex</h3>
        
        {/* Tabs para tipo de búsqueda */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => { setSearchType('name'); setSearchResults([]); setError(''); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              background: searchType === 'name' ? '#007bff' : '#e9ecef',
              color: searchType === 'name' ? 'white' : '#333',
            }}
          >
            Por Nombre
          </button>
          <button
            type="button"
            onClick={() => { setSearchType('number'); setSearchResults([]); setError(''); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              background: searchType === 'number' ? '#007bff' : '#e9ecef',
              color: searchType === 'number' ? 'white' : '#333',
            }}
          >
            Por Código
          </button>
        </div>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSearch} style={styles.searchForm}>
        <select
          value={searchLang}
          onChange={(e) => setSearchLang(e.target.value)}
          style={{
            padding: '12px',
            border: '2px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px',
            background: 'white',
            cursor: 'pointer',
            minWidth: '120px'
          }}
        >
          {searchLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>

        {searchType === 'name' ? (
          <input
            style={styles.searchInput}
            type="text"
            placeholder={searchLang === 'es' ? 'Busca por nombre de carta...' : 'Search by card name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        ) : (
          <>
            <select
              value={setCode}
              onChange={(e) => setSetCode(e.target.value)}
              style={{
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <option value="">-- Set --</option>
              {commonSetCodes.map(s => (
                <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
              ))}
              <option value="OTHER">Otro (escribir)</option>
            </select>
            {setCode === 'OTHER' && (
              <input
                style={{ ...styles.searchInput, maxWidth: '100px' }}
                type="text"
                placeholder="Código"
                onChange={(e) => setSetCode(e.target.value)}
              />
            )}
            <input
              style={{ ...styles.searchInput, maxWidth: '120px' }}
              type="text"
              placeholder="Ej: 182 o 182/198"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </>
        )}

        <button type="submit" style={styles.searchBtn} disabled={loading}>
          {loading ? '⏳ Buscando...' : '🔍 Buscar'}
        </button>
      </form>

      {searchType === 'number' && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
          💡 Ejemplo: Si la carta dice <strong>SVI 182/198</strong>, selecciona <strong>SVI</strong> y escribe <strong>182</strong>
        </div>
      )}

      {loading && <div style={styles.loading}>Buscando cartas...</div>}

      {!selectedCard && searchResults.length > 0 && (
        <div style={styles.resultsList}>
          {searchResults.map((card) => (
            <div
              key={card.id}
              style={styles.resultCard}
              onClick={() => handleSelectCard(card)}
              onMouseEnter={(e) => e.target.parentElement.style.borderColor = '#007bff'}
              onMouseLeave={(e) => e.target.parentElement.style.borderColor = '#ddd'}
            >
              {card.image && (
                <img
                  src={card.image}
                  alt={card.name}
                  style={styles.resultCardImg}
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div style={styles.resultCardName}>{card.name}</div>
              <div style={styles.resultCardSet}>{card.set?.name || 'Unknown Set'}</div>
              {card.rarity && card.rarity !== 'Unknown' && (
                <div style={{
                  fontSize: '10px',
                  marginTop: '4px',
                  padding: '2px 6px',
                  background: '#e0e7ff',
                  color: '#4338ca',
                  borderRadius: '3px',
                  display: 'inline-block'
                }}>
                  {card.rarity}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedCard && (
        <div style={styles.selectedContainer}>
          <div>
            {selectedCard.image && (
              <img
                src={selectedCard.image}
                alt={selectedCard.name}
                style={styles.selectedImage}
              />
            )}
          </div>

          <div style={styles.selectedInfo}>
            <div style={styles.selectedTitle}>{selectedCard.name}</div>
            <div style={styles.selectedMeta}>
              Set: {selectedCard.set?.name || 'Unknown'}<br />
              Rareza: <strong style={{ color: '#4338ca' }}>{selectedCard.rarity || 'Unknown'}</strong><br />
              Tipo: {selectedCard.category || 'Pokémon'}<br />
              ID: {selectedCard.localId || selectedCard.cardId}
            </div>

            <form onSubmit={handleAddToInventory}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Precio (USD) *</label>
                <input
                  style={styles.input}
                  type="number"
                  name="price"
                  value={inventoryData.price}
                  onChange={handleInventoryChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Stock (Cantidad) *</label>
                <input
                  style={styles.input}
                  type="number"
                  name="stock"
                  value={inventoryData.stock}
                  onChange={handleInventoryChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Idioma</label>
                <select style={styles.select} name="language" value={inventoryData.language} onChange={handleInventoryChange}>
                  <option>Español</option>
                  <option>Inglés</option>
                  <option>Francés</option>
                  <option>Alemán</option>
                  <option>Italiano</option>
                  <option>Portugués</option>
                  <option>Japonés</option>
                  <option>Chino</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Condición</label>
                <select style={styles.select} name="condition" value={inventoryData.condition} onChange={handleInventoryChange}>
                  <option>Mint</option>
                  <option>Near Mint</option>
                  <option>Lightly Played</option>
                  <option>Moderately Played</option>
                  <option>Heavily Played</option>
                  <option>Damaged</option>
                </select>
              </div>

              <div style={styles.buttonGroup}>
                <button type="submit" style={styles.addBtn} disabled={submitting}>
                  {submitting ? '⏳ Guardando...' : '✅ Agregar al Inventario'}
                </button>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setSelectedCard(null)}
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
