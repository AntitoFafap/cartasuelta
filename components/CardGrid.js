import { useState, useEffect } from 'react';
import CardItem from './CardItem';
import { useSearch } from '../context/SearchContext';

const RARITIES = ['Todas', 'Común', 'Poco Común', 'Raro', 'Ultra Raro', 'Secreto Raro', 'Sin Categoría'];
const SORTS = ['Precio: menor', 'Precio: mayor', 'Nombre A-Z'];
const ITEMS_PER_PAGE = 12; // Mostrar 12 cartas por página

// Normalizar rareza para el filtro
function normalizeRarity(rarity) {
  if (!rarity) return 'Sin Categoría';
  // Normalizar: quitar tildes y convertir a minúsculas
  const r = rarity.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Quitar tildes
  
  if (r.includes('common') && !r.includes('uncommon')) return 'Común';
  if (r.includes('uncommon') || r.includes('poco comun')) return 'Poco Común';
  if (r.includes('secret') || r.includes('secreto')) return 'Secreto Raro';
  if (r.includes('ultra') || r.includes('illustration') || r.includes('special art')) return 'Ultra Raro';
  if (r.includes('rare') || r.includes('holo') || r.includes('raro')) return 'Raro';
  if (r === 'comun') return 'Común';
  return 'Sin Categoría';
}

export default function CardGrid() {
  const [filter, setFilter] = useState('Todas');
  const [sort, setSort] = useState('Precio: menor');
  const [search, setSearch] = useState('');
  const [cards, setCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { searchTerm, setSearchTerm } = useSearch();

  // Sincronizar búsqueda global con búsqueda local
  useEffect(() => {
    if (searchTerm) {
      setSearch(searchTerm);
      setCurrentPage(1);
      // Limpiar el término global después de usarlo
      setSearchTerm('');
    }
  }, [searchTerm, setSearchTerm]);

  async function fetchCards() {
    try {
      const res = await fetch('/api/inventory');
      if (!res.ok) return;
      const data = await res.json();
      setCards(Array.isArray(data) ? data : []);
      setCurrentPage(1); // Reset a página 1 cuando se cargan nuevas cartas
    } catch (e) {
      console.error('Error cargando cartas:', e);
    }
  }

  useEffect(() => {
    fetchCards();

    // Escuchar actualizaciones desde el panel admin
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('cards-updates');
      bc.onmessage = (ev) => {
        if (!ev.data) return;
        if (ev.data.type === 'card-added' || ev.data.type === 'cards-updated') {
          fetchCards();
        }
      };
      return () => bc.close();
    }
  }, []);

  let visible = cards.filter(c => {
    const cardRarity = normalizeRarity(c.rarity);
    const matchRarity = filter === 'Todas' || cardRarity === filter;
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (c.set || '').toLowerCase().includes(search.toLowerCase());
    return matchRarity && matchSearch;
  });

  if (sort === 'Precio: menor') visible = [...visible].sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
  if (sort === 'Precio: mayor') visible = [...visible].sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
  if (sort === 'Nombre A-Z') visible = [...visible].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Paginación
  const totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const cardsToShow = visible.slice(startIdx, endIdx);

  return (
    <section style={styles.section} id="cartas">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Catálogo</p>
          <h2 style={styles.title}>CARTAS DISPONIBLES</h2>
        </div>
        <p style={styles.count}>{visible.length} resultados</p>
      </div>

      {/* Filters bar */}
      <div style={styles.filtersBar}>
        <input
          type="text"
          placeholder="Buscar carta o set..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          style={styles.searchInput}
        />

        <div style={styles.filterGroup}>
          {RARITIES.map(r => (
            <button
              key={r}
              onClick={() => { setFilter(r); setCurrentPage(1); }}
              style={{
                ...styles.filterBtn,
                background: filter === r ? 'var(--accent-purple)' : 'transparent',
                color: filter === r ? 'var(--accent-blue)' : 'var(--muted)',
                border: `1px solid ${filter === r ? 'var(--accent-purple)' : 'var(--border)'}`,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={styles.select}
        >
          {SORTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div style={styles.empty}>
          <span style={{ fontSize: '48px' }}>🔍</span>
          <p>No encontramos cartas con ese criterio.</p>
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {cardsToShow.map(card => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationBtn,
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Anterior
              </button>

              <div style={styles.pageInfo}>
                Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationBtn,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @media (max-width: 1024px) {
          section { padding: 60px 40px !important; }
        }
        @media (max-width: 768px) {
          section { padding: 40px 24px !important; }
          section > div:nth-child(2) { flex-direction: column !important; align-items: stretch !important; }
          section > div:nth-child(2) input { width: 100% !important; }
          section > div:nth-child(2) select { margin-left: 0 !important; width: 100% !important; }
          section > div:nth-child(2) > div { overflow-x: auto !important; flex-wrap: nowrap !important; padding-bottom: 8px !important; }
          section > div:nth-child(2) > div button { flex-shrink: 0 !important; padding: 8px 12px !important; font-size: 11px !important; }
        }
        @media (max-width: 480px) {
          section { padding: 30px 16px !important; }
          section > div:first-child h2 { font-size: 28px !important; }
          section > div:last-child { gap: 12px !important; }
          section > div:last-child button { padding: 8px 14px !important; font-size: 12px !important; }
        }
      `}</style>
    </section>
  );
}

const styles = {
  section: {
    padding: '80px 80px',
    background: 'var(--bg)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: '40px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  eyebrow: {
    fontSize: '12px',
    color: 'var(--yellow)',
    fontWeight: '700',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  title: {
    fontSize: 'clamp(32px, 5vw, 56px)',
    fontFamily: "'Bebas Neue', sans-serif",
    color: 'var(--text)',
    letterSpacing: '3px',
  },
  count: {
    fontSize: '14px',
    color: 'var(--muted)',
    fontWeight: '600',
  },
  filtersBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '40px',
    alignItems: 'center',
  },
  searchInput: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '10px 18px',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
    width: '240px',
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: '600',
  },
  filterGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Rajdhani', sans-serif",
  },
  select: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '10px 18px',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: '600',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '24px',
  },
  empty: {
    textAlign: 'center',
    padding: '80px',
    color: 'var(--muted)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    fontSize: '16px',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '40px',
    padding: '24px',
  },
  paginationBtn: {
    background: 'var(--accent-purple)',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: "'Rajdhani', sans-serif",
  },
  pageInfo: {
    fontSize: '14px',
    color: 'var(--text)',
    fontWeight: '600',
    minWidth: '120px',
    textAlign: 'center',
  },
};
