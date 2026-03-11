import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ManualCardEntry from '../../components/ManualCardEntry';
import InventorySearch from '../../components/InventorySearch';

export default function Inventory() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inventoryCards, setInventoryCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState([]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' o 'manual'
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSet, setFilterSet] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'price', 'stock'
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([checkAuth(), fetchInventory(), fetchSets()]);
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      if (!res.ok) router.push('/auth/login');
      else {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (e) {
      console.error('Error en checkAuth:', e);
      router.push('/auth/login');
    }
  }

  async function fetchInventory() {
    try {
      const res = await fetch('/api/inventory', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        setInventoryCards(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error cargando inventario:', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSets() {
    try {
      const res = await fetch('/api/sets');
      if (res.ok) {
        const data = await res.json();
        setSets(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error cargando sets:', e);
    }
  }

  const handleCardAdded = (newCard) => {
    setInventoryCards(prev => [newCard, ...prev]);
    setShowAddSection(false); // Cerrar sección de agregar después de añadir
    alert('✅ Carta agregada al inventario exitosamente');
  };

  // Función para actualizar stock rápidamente
  const handleQuickStockUpdate = async (id, delta) => {
    const card = inventoryCards.find(c => c.id === id);
    if (!card) return;
    
    const newStock = Math.max(0, (card.stock || 0) + delta);
    
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...card, stock: newStock })
      });

      if (res.ok) {
        const updated = await res.json();
        setInventoryCards(prev => prev.map(c => c.id === id ? updated : c));
      } else {
        alert('Error actualizando stock');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleDeleteCard = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta carta del inventario?')) return;

    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        setInventoryCards(prev => prev.filter(c => c.id !== id));
        alert('✅ Carta eliminada del inventario');
      } else {
        alert('Error eliminando carta');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleStartEdit = (card) => {
    setEditingId(card.id);
    setEditData({ ...card });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleSaveEdit = async () => {
    if (!editData.price || !editData.stock) {
      alert('Precio y stock son requeridos');
      return;
    }

    try {
      const res = await fetch(`/api/inventory/${editingId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (res.ok) {
        const updated = await res.json();
        setInventoryCards(prev => prev.map(c => c.id === editingId ? updated : c));
        setEditingId(null);
        setEditData(null);
        alert('✅ Carta actualizada');
      } else {
        alert('Error actualizando carta');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  // Helper para obtener nombre del set (puede ser string u objeto)
  const getSetName = (set) => {
    if (!set) return 'Unknown';
    if (typeof set === 'string') return set;
    if (typeof set === 'object' && set.name) return set.name;
    return 'Unknown';
  };

  const getFilteredAndSorted = () => {
    let filtered = inventoryCards.filter(card => {
      const matchSearch = card.name && card.name.toLowerCase().includes(filterSearch.toLowerCase());
      const setName = getSetName(card.set);
      const matchSet = !filterSet || setName === filterSet;
      return matchSearch && matchSet;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'stock':
          return b.stock - a.stock;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  };

  const filteredCards = getFilteredAndSorted();

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      paddingBottom: '20px',
      borderBottom: '2px solid #eee'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold'
    },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px'
    },
    tabBtn: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '15px',
      transition: 'all 0.3s'
    },
    tabBtnActive: {
      background: '#007bff',
      color: 'white'
    },
    tabBtnInactive: {
      background: '#e9ecef',
      color: '#333'
    },
    filterContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px',
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '5px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      marginBottom: '5px',
      fontWeight: 'bold',
      fontSize: '13px'
    },
    input: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '5px'
    },
    inventoryTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px'
    },
    tableHead: {
      background: '#f8f9fa',
      fontWeight: 'bold',
      borderBottom: '2px solid #ddd'
    },
    tableRow: {
      borderBottom: '1px solid #eee'
    },
    tableCell: {
      padding: '15px',
      textAlign: 'left'
    },
    cardImage: {
      width: '50px',
      height: 'auto',
      borderRadius: '3px'
    },
    actionBtn: {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 'bold',
      marginRight: '5px'
    },
    editBtn: {
      background: '#007bff',
      color: 'white'
    },
    deleteBtn: {
      background: '#dc3545',
      color: 'white'
    },
    saveBtn: {
      background: '#28a745',
      color: 'white'
    },
    cancelBtn: {
      background: '#6c757d',
      color: 'white'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#999'
    },
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    statCard: {
      background: '#f8f9fa',
      padding: '15px',
      borderRadius: '5px',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#007bff'
    },
    statLabel: {
      fontSize: '13px',
      color: '#666',
      marginTop: '5px'
    },
    editForm: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '10px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>⏳ Cargando inventario...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📦 Gestión de Inventario</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {currentUser && <span style={{ fontSize: '14px', color: '#666' }}>Bienvenido, {currentUser.username}!</span>}
          <button
            style={{
              ...styles.tabBtn,
              background: showAddSection ? '#dc3545' : '#28a745',
              color: 'white'
            }}
            onClick={() => setShowAddSection(!showAddSection)}
          >
            {showAddSection ? '✕ Cerrar' : '+ Agregar Carta'}
          </button>
        </div>
      </div>

      {/* Estadísticas - Calculadas dinámicamente */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{inventoryCards.length}</div>
          <div style={styles.statLabel}>Cartas en Inventario</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            ${inventoryCards.reduce((sum, c) => sum + ((c.price || 0) * (c.stock || 0)), 0).toFixed(2)}
          </div>
          <div style={styles.statLabel}>Valor Total</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{inventoryCards.reduce((sum, c) => sum + (c.stock || 0), 0)}</div>
          <div style={styles.statLabel}>Stock Total</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{new Set(inventoryCards.map(c => getSetName(c.set))).size}</div>
          <div style={styles.statLabel}>Sets Diferentes</div>
        </div>
      </div>

      {/* Sección de Agregar Carta (colapsable) */}
      {showAddSection && (
        <div style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '10px', border: '2px solid #007bff' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>➕ Agregar Nueva Carta</h3>
          
          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'search' ? styles.tabBtnActive : styles.tabBtnInactive)
              }}
              onClick={() => setActiveTab('search')}
            >
              🔍 Buscar en TCGdex
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'manual' ? styles.tabBtnActive : styles.tabBtnInactive)
              }}
              onClick={() => setActiveTab('manual')}
            >
              ✏️ Ingreso Manual
            </button>
          </div>

          {/* Contenido de Tabs */}
          {activeTab === 'search' && <InventorySearch onCardAdded={handleCardAdded} sets={sets} />}
          {activeTab === 'manual' && <ManualCardEntry onCardAdded={handleCardAdded} sets={sets} />}
        </div>
      )}

      {/* Filtros del Inventario */}
      <h3 style={{ marginBottom: '15px', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
        📋 Mi Inventario ({filteredCards.length} {filteredCards.length === 1 ? 'carta' : 'cartas'})
      </h3>
      
      {inventoryCards.length > 0 && (
        <div style={styles.filterContainer}>
          <div style={styles.formGroup}>
            <label style={styles.label}>🔍 Buscar por Nombre</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Ej: Pikachu"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>📦 Filtrar por Set</label>
            <select style={styles.input} value={filterSet} onChange={(e) => setFilterSet(e.target.value)}>
              <option value="">Todos los Sets</option>
              {Array.from(new Set(inventoryCards.map(c => getSetName(c.set)))).map(setName => (
                <option key={setName} value={setName}>{setName}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>⚖️ Ordenar por</label>
            <select style={styles.input} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Nombre (A-Z)</option>
              <option value="price">Precio (Mayor a Menor)</option>
              <option value="stock">Stock (Mayor a Menor)</option>
            </select>
          </div>
        </div>
      )}

      {/* Tabla de Inventario */}
      {filteredCards.length === 0 ? (
        <div style={styles.emptyState}>
          {inventoryCards.length === 0 ? '📚 Sin cartas en el inventario. ¡Comienza agregando cartas!' : '❌ No se encontraron cartas con los filtros aplicados'}
        </div>
      ) : (
        <table style={styles.inventoryTable}>
          <thead style={styles.tableHead}>
            <tr style={styles.tableRow}>
              <td style={styles.tableCell}>Imagen</td>
              <td style={styles.tableCell}>Nombre</td>
              <td style={styles.tableCell}>Set</td>
              <td style={styles.tableCell}>Rareza</td>
              <td style={styles.tableCell}>Idioma</td>
              <td style={styles.tableCell}>Condición</td>
              <td style={styles.tableCell}>Precio</td>
              <td style={styles.tableCell}>Stock</td>
              <td style={styles.tableCell}>Acciones</td>
            </tr>
          </thead>
          <tbody>
            {filteredCards.map(card => (
              <tr key={card.id} style={styles.tableRow}>
                {editingId === card.id ? (
                  <>
                    <td colSpan="9" style={styles.tableCell}>
                      <div style={styles.editForm}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Nombre</label>
                          <input
                            style={styles.input}
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Precio</label>
                          <input
                            style={styles.input}
                            type="number"
                            value={editData.price}
                            step="0.01"
                            onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Stock</label>
                          <input
                            style={styles.input}
                            type="number"
                            value={editData.stock}
                            onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) })}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Idioma</label>
                          <select
                            style={styles.input}
                            value={editData.language}
                            onChange={(e) => setEditData({ ...editData, language: e.target.value })}
                          >
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
                          <select
                            style={styles.input}
                            value={editData.condition}
                            onChange={(e) => setEditData({ ...editData, condition: e.target.value })}
                          >
                            <option>Mint</option>
                            <option>Near Mint</option>
                            <option>Lightly Played</option>
                            <option>Moderately Played</option>
                            <option>Heavily Played</option>
                            <option>Damaged</option>
                          </select>
                        </div>
                        <div style={styles.formGroup}>
                          <button
                            style={{ ...styles.actionBtn, ...styles.saveBtn }}
                            onClick={handleSaveEdit}
                          >
                            💾 Guardar
                          </button>
                          <button
                            style={{ ...styles.actionBtn, ...styles.cancelBtn }}
                            onClick={handleCancelEdit}
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={styles.tableCell}>
                      {card.imageUrl && (
                        <img src={card.imageUrl} alt={card.name} style={styles.cardImage} onError={(e) => e.target.style.display = 'none'} />
                      )}
                    </td>
                    <td style={styles.tableCell}>
                      <strong>{card.name}</strong>
                      {card.cardNumber && <div style={{ fontSize: '12px', color: '#666' }}>#{card.cardNumber}</div>}
                    </td>
                    <td style={styles.tableCell}>{getSetName(card.set)}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: card.rarity === 'Rare' ? '#fef3c7' : 
                                   card.rarity === 'Ultra Rare' || card.rarity === 'Illustration Rare' ? '#fce7f3' : 
                                   card.rarity === 'Special Art Rare' || card.rarity === 'Hyper Rare' ? '#e0e7ff' :
                                   card.rarity === 'Common' ? '#f3f4f6' : '#ecfdf5',
                        color: card.rarity === 'Rare' ? '#92400e' : 
                               card.rarity === 'Ultra Rare' || card.rarity === 'Illustration Rare' ? '#be185d' : 
                               card.rarity === 'Special Art Rare' || card.rarity === 'Hyper Rare' ? '#4338ca' :
                               card.rarity === 'Common' ? '#374151' : '#065f46'
                      }}>
                        {card.rarity || 'Unknown'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>{card.language}</td>
                    <td style={styles.tableCell}>{card.condition}</td>
                    <td style={styles.tableCell}>${card.price.toFixed(2)}</td>
                    <td style={styles.tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                          style={{
                            width: '28px',
                            height: '28px',
                            border: 'none',
                            borderRadius: '4px',
                            background: '#dc3545',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                          onClick={() => handleQuickStockUpdate(card.id, -1)}
                          disabled={card.stock <= 0}
                        >
                          −
                        </button>
                        <strong style={{ 
                          minWidth: '30px', 
                          textAlign: 'center',
                          fontSize: card.stock === 0 ? '14px' : 'inherit', 
                          color: card.stock === 0 ? '#dc3545' : 'inherit' 
                        }}>
                          {card.stock}
                        </strong>
                        <button
                          style={{
                            width: '28px',
                            height: '28px',
                            border: 'none',
                            borderRadius: '4px',
                            background: '#28a745',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                          onClick={() => handleQuickStockUpdate(card.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <button
                        style={{ ...styles.actionBtn, ...styles.editBtn }}
                        onClick={() => handleStartEdit(card)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                        onClick={() => handleDeleteCard(card.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
