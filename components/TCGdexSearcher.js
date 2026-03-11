
import { useState } from 'react';
import setsList from '../sets.json';

export default function TCGdexSearcher({ onCardImported, styles }) {
  const [searchTab, setSearchTab] = useState('search'); // 'search' o 'sets'
  const [searchType, setSearchType] = useState('name'); // 'name' o 'code'
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [setCode, setSetCode] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCollection, setFilterCollection] = useState('');
  const uniqueTypes = [...new Set(searchResults.flatMap(c => c.types || []))].sort();
  const uniqueCollections = [...new Set(searchResults.map(c => {
    const setName = typeof c.set === 'string' ? c.set : (c.set?.name || 'Unknown');
    return setName;
  }))].sort();
  const filtered = searchResults.filter(card => {
    const matchType = !filterType || (card.types && card.types.includes(filterType));
    const cardSetName = typeof card.set === 'string' ? card.set : (card.set?.name || 'Unknown');
    const matchCollection = !filterCollection || cardSetName === filterCollection;
    return matchType && matchCollection;
  });

  async function handleSearch(e) {
    e.preventDefault();
    if (searchType === 'name' && !searchQuery.trim()) return;
    if (searchType === 'code' && (!setCode.trim() || !cardNumber.trim())) return;
    setSearching(true);
    setSearched(true);
    try {
      let allResults = [];
      const seenIds = new Set();
      const searchLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt'];
      const searchPromises = searchLanguages.map(async (lang) => {
        try {
          let res;
          if (searchType === 'name') {
            res = await fetch(`/api/tcgdex/search?q=${encodeURIComponent(searchQuery)}&lang=${lang}`);
          } else {
            res = await fetch(`/api/tcgdex/search-by-number?set=${encodeURIComponent(setCode)}&number=${encodeURIComponent(cardNumber)}&lang=${lang}`);
          }
          if (!res.ok) return [];
          const data = await res.json();
          const results = searchType === 'code' ? (data.results || []) : data;
          return results.map(card => ({ ...card, searchLang: lang }));
        } catch {
          return [];
        }
      });
      const resultsPerLang = await Promise.all(searchPromises);
      for (const results of resultsPerLang) {
        for (const card of results) {
          const cardId = card.id || card.cardId;
          if (!seenIds.has(cardId)) {
            seenIds.add(cardId);
            allResults.push(card);
          }
        }
      }
      setSearchResults(allResults);
      if (allResults.length === 0) {
        alert(searchType === 'name' ? 'No se encontraron cartas con ese nombre' : 'No se encontró la carta con ese código');
      }
    } catch (error) {
      alert('Error buscando cartas: ' + error.message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', justifyContent: 'center' }}>
        {searchType === 'name' ? (
          <input
            type="text"
            placeholder="Buscar cartas por nombre (ej: Charizard)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '250px', flex: 1 }}
          />
        ) : (
          <>
            <input
              type="text"
              placeholder="Set (ej: SVI)"
              value={setCode}
              onChange={e => setSetCode(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '100px' }}
            />
            <input
              type="text"
              placeholder="Número (ej: 182)"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '100px' }}
            />
          </>
        )}
        <button type="submit" disabled={searching} style={{ padding: '10px 20px', borderRadius: '6px', background: '#8b5cf6', color: 'white', border: 'none', fontWeight: 600, opacity: searching ? 0.6 : 1 }}>
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
        <button type="button" onClick={() => setSearchType(searchType === 'name' ? 'code' : 'name')} style={{ marginLeft: 8, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#f3f4f6', color: '#333', fontWeight: 600 }}>
          {searchType === 'name' ? 'Buscar por código' : 'Buscar por nombre'}
        </button>
      </form>

      {/* Resultados y filtros */}
      {searched && !searching && searchResults.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          <p>No se encontraron cartas {searchType === 'name' ? `con "${searchQuery}"` : `con código ${setCode} ${cardNumber}`}</p>
        </div>
      )}
      {searchResults.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: '16px', display: 'flex', gap: 12 }}>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ minWidth: 120, padding: 8, borderRadius: 6, border: '1px solid #ddd' }}>
              <option value="">Todos los tipos</option>
              {uniqueTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={filterCollection} onChange={e => setFilterCollection(e.target.value)} style={{ minWidth: 120, padding: 8, borderRadius: 6, border: '1px solid #ddd' }}>
              <option value="">Todas las colecciones</option>
              {uniqueCollections.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {(filterType || filterCollection) && (
              <button type="button" onClick={() => { setFilterType(''); setFilterCollection(''); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontWeight: 600 }}>
                Limpiar filtros
              </button>
            )}
          </div>
          {/* ...aquí iría el renderizado de resultados, que ya tienes abajo... */}
        </div>
      )}
      {/* ...el resto del render de resultados y formulario de importación... */}
    </div>
  );
          {searched && !searching && searchResults.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              <p>No se encontraron cartas {searchType === 'name' ? `con "${searchQuery}"` : `con código ${setCode} ${cardNumber}`}</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={styles.tcgdexResults}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                  {filtered.length} de {searchResults.length} cartas
                </h4>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    style={{ ...styles.tcgdexInput, flex: '1', minWidth: '150px' }}
                  >
                    <option value="">Todos los tipos</option>
                    {uniqueTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={filterCollection}
                    onChange={e => setFilterCollection(e.target.value)}
                    style={{ ...styles.tcgdexInput, flex: '1', minWidth: '150px' }}
                  >
                    <option value="">Todas las colecciones</option>
                    {uniqueCollections.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {(filterType || filterCollection) && (
                    <button
                      onClick={() => {
                        setFilterType('');
                        setFilterCollection('');
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '600px',
                overflowY: 'auto',
              }}>
                {filtered.map(card => (
                  <div 
                    key={card.id} 
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#fafafa',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Imagen pequeña */}
                    <div style={{
                      flexShrink: 0,
                      width: '80px',
                      height: '110px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      backgroundColor: '#f5f5f5',
                    }}>
                      {card.image ? (
                        <img
                          src={card.image}
                          alt={card.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          fontSize: '10px',
                        }}>
                          No img
                        </div>
                      )}
                    </div>

                    {/* Info de carta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        margin: '0 0 4px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        {card.name}
                        {card.isLatestSet && (
                          <span style={{
                            marginLeft: '8px',
                            background: '#facc15',
                            color: '#92400e',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            border: '1px solid #fde68a',
                          }}>
                            NUEVO SET
                          </span>
                        )}
                      </h4>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: '12px',
                        color: '#666',
                      }}>
                        {typeof card.set === 'string' ? card.set : (card.set?.name || 'Unknown')} #{card.number || card.localId || 'N/A'}
                      </p>
                      {card.rarity && card.rarity !== 'Unknown' && (
                        <span style={{
                          display: 'inline-block',
                          fontSize: '10px',
                          padding: '2px 6px',
                          background: '#ddd6fe',
                          color: '#4c1d95',
                          borderRadius: '4px',
                          marginBottom: '4px',
                        }}>
                          {card.rarity}
                        </span>
                      )}
                      {card.types && card.types.length > 0 && (
                        <p style={{
                          margin: '0',
                          fontSize: '11px',
                          color: '#999',
                        }}>
                          Tipos: {card.types.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Formulario de importación */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      minWidth: '300px',
                    }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          placeholder="Precio"
                          step="100"
                          value={importPrice[card.id] || ''}
                          onChange={e =>
                            setImportPrice({
                              ...importPrice,
                              [card.id]: e.target.value,
                            })
                          }
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Ganancia"
                          value={importProfit[card.id] || ''}
                          onChange={e =>
                            setImportProfit({
                              ...importProfit,
                              [card.id]: e.target.value,
                            })
                          }
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Stock"
                          min="0"
                          value={importStock[card.id] || ''}
                          onChange={e =>
                            setImportStock({
                              ...importStock,
                              [card.id]: e.target.value,
                            })
                          }
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={importLanguage[card.id] || 'Spanish'}
                          onChange={e =>
                            setImportLanguage({
                              ...importLanguage,
                              [card.id]: e.target.value,
                            })
                          }
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                          }}
                        >
                          <option value="Spanish">Español</option>
                          <option value="English">English</option>
                          <option value="Japanese">日本語</option>
                          <option value="French">Français</option>
                          <option value="German">Deutsch</option>
                          <option value="Italian">Italiano</option>
                        </select>
                        <select
                          value={importCondition[card.id] || 'Near Mint'}
                          onChange={e =>
                            setImportCondition({
                              ...importCondition,
                              [card.id]: e.target.value,
                            })
                          }
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                          }}
                        >
                          <option value="Mint">Mint</option>
                          <option value="Near Mint">Near Mint</option>
                          <option value="Lightly Played">Lightly Played</option>
                          <option value="Moderately Played">Moderately Played</option>
                          <option value="Heavily Played">Heavily Played</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>
                      <button
                        onClick={() => importCard(card)}
                        disabled={importingCard === card.id}
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: importingCard === card.id ? '#d1d5db' : '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: importingCard === card.id ? 'not-allowed' : 'pointer',
                          opacity: importingCard === card.id ? 0.6 : 1,
                        }}
                      >
                        {importingCard === card.id ? 'Importando...' : 'Importar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
}
