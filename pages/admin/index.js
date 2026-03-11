import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TCGdexSearcher from '../../components/TCGdexSearcher';

export default function Admin() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCard, setNewCard] = useState({ name: '', set: '', price: '', rarity: 'Común', language: 'Español', image: '', stock: '', cardType: 'Pokémon', supporterFinish: '' });
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingRarityId, setEditingRarityId] = useState(null);
  const [editingProfitId, setEditingProfitId] = useState(null);
  
  // Opciones de rareza disponibles
  const RARITY_OPTIONS = ['Común', 'Poco Común', 'Raro', 'Ultra Raro', 'Secreto Raro', 'Sin Categoría'];
  
  // Estado para usuarios
  const [users, setUsers] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'moderator', email: '' });
  const [userFormError, setUserFormError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estado para sección de administradores
  const [showAdminSection, setShowAdminSection] = useState(false);
  const [adminFormLoading, setAdminFormLoading] = useState(false);
  
  // Sets/colecciones configurables
  const [availableSets, setAvailableSets] = useState([]);
  const [showAddSet, setShowAddSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  
  // Filtros
  const [searchName, setSearchName] = useState('');
  const [filterSet, setFilterSet] = useState('');
  const [filterRarity, setFilterRarity] = useState('');
  const [sortPrice, setSortPrice] = useState('none');
  
  // Estadísticas
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const router = useRouter();
  
  // Verificar si el usuario actual es superadmin
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  useEffect(() => {
    // Ejecutar llamadas iniciales (sin usuarios ni estadísticas - dependen del rol)
    Promise.all([checkAuth(), fetchCards(), fetchSets()]).catch(e => {
      console.error('Error en inicialización del admin:', e);
    });
  }, []);
  
  // Cargar usuarios y estadísticas solo si es superadmin
  useEffect(() => {
    if (currentUser && currentUser.role === 'superadmin') {
      fetchStats();
      fetchUsers();
    } else {
      setLoadingStats(false);
      setUsers([]);
    }
  }, [currentUser]);

  async function fetchStats() {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
    } finally {
      setLoadingStats(false);
    }
  }

  async function fetchSets() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 segundos
      
      const res = await fetch('/api/sets', { 
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        setAvailableSets(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error cargando sets', e);
      setAvailableSets([]);
    }
  }

  async function addNewSet() {
    if (!newSetName || newSetName.trim().length < 2) return alert('Nombre de colección demasiado corto');
    try {
      const res = await fetch('/api/sets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSetName })
      });

      const data = await res.json();
      if (res.ok) {
        const name = data.name || newSetName;
        setAvailableSets(prev => Array.from(new Set([...prev, name])));
        setNewCard({...newCard, set: name});
        setNewSetName('');
        setShowAddSet(false);
      } else {
        alert(data.error || 'Error añadiendo colección');
      }
    } catch (e) {
      console.error('Error añadiendo set', e);
      alert('Error añadiendo colección');
    }
  }

  async function checkAuth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch('/api/admin/me', { 
        credentials: 'include',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
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

  async function fetchCards() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch('/api/inventory', { 
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      setCards(Array.isArray(data) ? data : []); 
    } catch (e) {
      console.error('Error cargando cartas:', e);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(`/api/admin/users?_t=${Date.now()}`, { 
        credentials: 'include',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error cargando usuarios:', e);
      setUsers([]);
    }
  }

  async function addUser(e) {
    e.preventDefault();
    setUserFormError('');
    setAdminFormLoading(true);
    
    if (!newUser.username || !newUser.password) {
      setUserFormError('Usuario y contraseña requeridos');
      setAdminFormLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        setNewUser({ username: '', password: '', role: 'moderator', email: '' });
        setShowUserMenu(false);
        fetchUsers();
      } else {
        const data = await res.json();
        setUserFormError(data.error || 'Error creando usuario');
      }
    } catch (err) {
      setUserFormError('Error de conexión');
    } finally {
      setAdminFormLoading(false);
    }
  }

  async function deleteUser(username) {
    if (!confirm(`¿Eliminar usuario ${username}?`)) return;
    
    const res = await fetch(`/api/admin/users/${username}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (res.ok) {
      fetchUsers();
    } else {
      alert('Error eliminando usuario');
    }
  }

  async function addCard(e) {
    e.preventDefault();
    setFormError('');
    
    if (!newCard.name || !newCard.set || !newCard.price) {
      setFormError('Todos los campos son requeridos');
      return;
    }

    if (newCard.image && !newCard.image.startsWith('http')) {
      setFormError('La URL de imagen debe comenzar con http:// o https://');
      return;
    }

    const payload = { ...newCard, imageUrl: newCard.image };
    console.log('Sending card payload:', payload);
    const res = await fetch('/api/cards', { 
      method: 'POST', 
      credentials: 'include',
      headers: { 'Content-Type':'application/json' }, 
      body: JSON.stringify(payload) 
    });
    
    const data = await res.json().catch(() => null);
    if (res.ok) { 
      setNewCard({ name:'', set:'', price:'', rarity: 'Común', language: 'Español', image: '', stock: '', cardType: 'Pokémon', supporterFinish: '' }); 
      fetchCards(); 
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('cards-updates');
          bc.postMessage({ type: 'card-added', card: data });
          bc.close();
        }
      } catch (e) {
        console.error('Error broadcasting card-added', e);
      }
    } else {
      const errorMsg = data?.error || data?.message || `Error ${res.status}: ${res.statusText}`;
      setFormError(errorMsg);
      console.error('Card creation failed:', { status: res.status, data });
    }
  }

  // Función para filtrar y ordenar cartas
  function getFilteredAndSortedCards() {
    let filtered = cards.filter(card => {
      const matchName = !card.name || card.name.toLowerCase().includes(searchName.toLowerCase());
      const matchSet = !filterSet || getSetName(card.set) === filterSet;
      const matchRarity = !filterRarity || !card.rarity || card.rarity === filterRarity;
      return matchName && matchSet && matchRarity;
    });

    // Ordenar por precio
    if (sortPrice === 'asc') {
      filtered.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
    } else if (sortPrice === 'desc') {
      filtered.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
    }

    return filtered;
  }

  // Obtener sets y rareza únicas para los filtros
  const uniqueSets = [...new Set(cards.map(c => getSetName(c.set)).filter(s => s && s !== 'Unknown'))].sort();
  const rarities = ['Común', 'Poco Común', 'Raro', 'Ultra Raro', 'Secreto Raro'];
  const filteredCards = getFilteredAndSortedCards();

  async function updatePrice(id, price) {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('El precio debe ser un número positivo');
      return;
    }
    try {
      await fetch(`/api/inventory/${id}`, { 
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' }, 
        body: JSON.stringify({ price: priceNum }) 
      });
      setEditingId(null);
      fetchCards();
    } catch (error) {
      console.error('Error actualizando precio:', error);
      alert('Error al actualizar precio');
    }
  }

  async function updateStock(id, stock) {
    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      alert('El stock debe ser un número no negativo');
      return;
    }
    try {
      await fetch(`/api/inventory/${id}`, { 
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' }, 
        body: JSON.stringify({ stock: stockNum }) 
      });
      setEditingStockId(null);
      fetchCards();
    } catch (error) {
      console.error('Error actualizando stock:', error);
      alert('Error al actualizar stock');
    }
  }

  async function updateRarity(id, rarity) {
    try {
      await fetch(`/api/inventory/${id}`, { 
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' }, 
        body: JSON.stringify({ rarity: rarity }) 
      });
      setEditingRarityId(null);
      fetchCards();
    } catch (error) {
      console.error('Error actualizando rareza:', error);
      alert('Error al actualizar rareza');
    }
  }

  async function updateProfit(id, profit) {
    const profitNum = parseFloat(profit);
    if (isNaN(profitNum) || profitNum < 0) {
      alert('La ganancia debe ser un número no negativo');
      return;
    }
    try {
      await fetch(`/api/inventory/${id}`, { 
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' }, 
        body: JSON.stringify({ profit: profitNum }) 
      });
      setEditingProfitId(null);
      fetchCards();
    } catch (error) {
      console.error('Error actualizando ganancia:', error);
      alert('Error al actualizar ganancia');
    }
  }

  async function deleteCard(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta carta?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        alert('Carta eliminada correctamente');
        setCards(cards.filter(c => c.id !== id));
      } else {
        alert('Error al eliminar: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error eliminando carta:', error);
      alert('Error de conexión al eliminar');
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    router.push('/admin/login');
  }

  if (loading) return <LoadingScreen />;

  function getRarityTagStyle(rarity) {
    if (!rarity) return { background: '#f3f4f6', color: '#6b7280' };
    
    const rarityLower = rarity.toLowerCase();
    
    const rarityColors = {
      'Común': { background: '#dcfce7', color: '#166534' },
      'Poco Común': { background: '#cffafe', color: '#155e75' },
      'Raro': { background: '#fed7aa', color: '#92400e' },
      'Ultra Raro': { background: '#fbcfe8', color: '#831843' },
      'Secreto Raro': { background: '#ddd6fe', color: '#4c1d95' },
    };
    
    // Match exacto primero
    if (rarityColors[rarity]) return rarityColors[rarity];
    
    // Match por contenido (para rarezas en inglés que no se mapearon)
    if (rarityLower.includes('secret') || rarityLower.includes('gold') || rarityLower.includes('hyper')) {
      return rarityColors['Secreto Raro'];
    }
    if (rarityLower.includes('ultra') || rarityLower.includes('vmax') || rarityLower.includes('vstar') || 
        rarityLower.includes('full art') || rarityLower.includes('illustration') || /\bv\b/.test(rarityLower)) {
      return rarityColors['Ultra Raro'];
    }
    if (rarityLower.includes('rare') || rarityLower.includes('holo')) {
      return rarityColors['Raro'];
    }
    if (rarityLower.includes('uncommon')) {
      return rarityColors['Poco Común'];
    }
    if (rarityLower.includes('common')) {
      return rarityColors['Común'];
    }
    
    return { background: '#f3f4f6', color: '#6b7280' }; // default gris
  }

  // Helper para obtener nombre del set (puede ser string u objeto)
  function getSetName(set) {
    if (!set) return 'Unknown';
    if (typeof set === 'string') return set;
    if (typeof set === 'object' && set.name) return set.name;
    return 'Unknown';
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1) !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        table tbody tr:hover {
          background-color: rgba(124, 58, 237, 0.02);
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <button style={styles.storeBtn} onClick={() => router.push('/')}>
              ← Volver
            </button>
            <div>
              <h1 style={styles.headerTitle}>Panel de Administración</h1>
              <p style={styles.headerSubtitle}>Gestiona tu colección de cartas Pokémon</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <div style={styles.userMenu}>
              <button 
                style={styles.userMenuBtn}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                Usuarios ▼
              </button>
              {showUserMenu && (
                <div style={styles.userMenuDropdown}>
                  <div style={styles.userMenuHeader}>Usuarios ({users.length})</div>
                  <div style={styles.usersList}>
                    {users.map(user => (
                      <div key={user.id || user.username} style={styles.userItem}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                          <strong style={{fontSize: '14px', color: '#0f1724'}}>{user.username || 'Sin nombre'}</strong>
                          <span style={{fontSize: '12px', color: '#6b7280'}}>{user.email || ''}</span>
                        </div>
                        <span style={styles.roleTag}>{user.role}</span>
                        {user.username !== currentUser?.username && (
                          <button
                            style={styles.deleteUserBtn}
                            onClick={() => deleteUser(user.username)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={styles.userMenuDivider}></div>
                  <form onSubmit={addUser} style={styles.userForm}>
                    <input
                      type="text"
                      placeholder="Nuevo usuario"
                      value={newUser.username}
                      onChange={e => setNewUser({...newUser, username: e.target.value})}
                      style={styles.userFormInput}
                    />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      style={styles.userFormInput}
                    />
                    <input
                      type="email"
                      placeholder="Email (opcional)"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      style={styles.userFormInput}
                    />
                    <select
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value})}
                      style={styles.userFormInput}
                    >
                      <option value="superadmin">Super Admin</option>
                      <option value="moderator">Moderador</option>
                    </select>
                    {userFormError && <div style={styles.userFormError}>{userFormError}</div>}
                    <button type="submit" style={styles.userFormSubmit}>
                      Crear Usuario
                    </button>
                  </form>
                </div>
              )}
            </div>
            <button style={styles.logoutBtn} onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Admin Management Section - Solo visible para superadmin */}
        {isSuperAdmin && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              👥 Gestión de Administradores
            </h2>
            <button 
              onClick={() => setShowAdminSection(!showAdminSection)}
              style={{...styles.filterBtn, background: showAdminSection ? 'var(--accent-purple)' : 'transparent', color: showAdminSection ? 'white' : 'var(--muted)'}}
            >
              {showAdminSection ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showAdminSection && (
            <div style={styles.adminSection}>
              {/* Lista de admins actuales */}
              <div style={styles.adminListContainer}>
                <h3 style={styles.statsSubtitle}>Usuarios Administradores ({users.length})</h3>
                <div style={styles.adminList}>
                  {users.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '20px', color: 'var(--muted)'}}>No hay administradores registrados</div>
                  ) : (
                    users.map(user => (
                      <div key={user.username} style={styles.adminCard}>
                        <div style={styles.adminCardInfo}>
                          <div style={styles.adminCardName}>{user.username}</div>
                          <div style={styles.adminCardEmail}>{user.email || 'Sin email'}</div>
                        </div>
                        <div style={styles.adminCardRole}>
                          <span style={{
                            ...styles.roleTag,
                            background: user.role === 'superadmin' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : '#3b82f6',
                            color: 'white'
                          }}>
                            {user.role === 'superadmin' ? '👑 Super Admin' : '🔧 Moderador'}
                          </span>
                        </div>
                        {user.username !== currentUser?.username && (
                          <button
                            style={styles.adminDeleteBtn}
                            onClick={() => deleteUser(user.username)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Formulario para crear nuevo admin */}
              <div style={styles.adminFormContainer}>
                <h3 style={styles.statsSubtitle}>➕ Crear Nuevo Administrador</h3>
                <form onSubmit={addUser} style={styles.adminForm}>
                  <div style={styles.adminFormRow}>
                    <div style={styles.adminFormGroup}>
                      <label style={styles.adminFormLabel}>Nombre de usuario *</label>
                      <input
                        type="text"
                        placeholder="Ej: admin_juan"
                        value={newUser.username}
                        onChange={e => setNewUser({...newUser, username: e.target.value})}
                        style={styles.adminFormInput}
                        required
                      />
                    </div>
                    <div style={styles.adminFormGroup}>
                      <label style={styles.adminFormLabel}>Contraseña *</label>
                      <input
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={newUser.password}
                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                        style={styles.adminFormInput}
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.adminFormRow}>
                    <div style={styles.adminFormGroup}>
                      <label style={styles.adminFormLabel}>Email (opcional)</label>
                      <input
                        type="email"
                        placeholder="admin@ejemplo.com"
                        value={newUser.email}
                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                        style={styles.adminFormInput}
                      />
                    </div>
                    <div style={styles.adminFormGroup}>
                      <label style={styles.adminFormLabel}>Rol *</label>
                      <select
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                        style={styles.adminFormInput}
                      >
                        <option value="superadmin">👑 Super Admin - Acceso completo</option>
                        <option value="moderator">🔧 Moderador - Acceso limitado</option>
                      </select>
                    </div>
                  </div>
                  {userFormError && <div style={styles.adminFormError}>{userFormError}</div>}
                  <div style={styles.adminFormActions}>
                    <button 
                      type="submit" 
                      style={styles.adminFormSubmit}
                      disabled={adminFormLoading}
                    >
                      {adminFormLoading ? 'Creando...' : '✓ Crear Administrador'}
                    </button>
                  </div>
                </form>
                <div style={styles.adminRolesInfo}>
                  <p><strong>👑 Super Admin:</strong> Acceso completo al panel, puede crear/eliminar usuarios, ver estadísticas de ventas y gestionar todo el inventario.</p>
                  <p><strong>🔧 Moderador:</strong> Solo puede gestionar inventario. No tiene acceso a estadísticas de ventas ni administración de usuarios.</p>
                </div>
              </div>
            </div>
          )}
        </section>
        )}

        {/* Statistics Section - Solo visible para superadmin */}
        {isSuperAdmin && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              📊 Estadísticas de Ventas
            </h2>
            <button 
              onClick={() => setShowStats(!showStats)}
              style={{...styles.filterBtn, background: showStats ? 'var(--accent-purple)' : 'transparent', color: showStats ? 'white' : 'var(--muted)'}}
            >
              {showStats ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showStats && (
            loadingStats ? (
              <div style={{textAlign: 'center', padding: '40px', color: 'var(--muted)'}}>
                Cargando estadísticas...
              </div>
            ) : stats ? (
              <div style={styles.statsContainer}>
                {/* Cards de resumen */}
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statCardIcon}>💰</div>
                    <div style={styles.statCardContent}>
                      <div style={styles.statCardValue}>${stats.revenueToday?.toLocaleString('es-CL') || 0}</div>
                      <div style={styles.statCardLabel}>Ingresos Hoy</div>
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statCardIcon}>📦</div>
                    <div style={styles.statCardContent}>
                      <div style={styles.statCardValue}>{stats.ordersToday || 0}</div>
                      <div style={styles.statCardLabel}>Órdenes Hoy</div>
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statCardIcon}>🎴</div>
                    <div style={styles.statCardContent}>
                      <div style={styles.statCardValue}>{stats.cardsSoldToday || 0}</div>
                      <div style={styles.statCardLabel}>Cartas Hoy</div>
                    </div>
                  </div>
                  <div style={{...styles.statCard, background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'}}>
                    <div style={{...styles.statCardIcon, color: 'rgba(255,255,255,0.8)'}}>📈</div>
                    <div style={styles.statCardContent}>
                      <div style={{...styles.statCardValue, color: 'white'}}>${stats.revenueMonth?.toLocaleString('es-CL') || 0}</div>
                      <div style={{...styles.statCardLabel, color: 'rgba(255,255,255,0.8)'}}>Ingresos del Mes</div>
                    </div>
                  </div>
                </div>

                {/* Resumen adicional */}
                <div style={styles.statsRow}>
                  <div style={styles.statsSummary}>
                    <h3 style={styles.statsSubtitle}>Resumen General</h3>
                    <div style={styles.summaryGrid}>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Total Órdenes</span>
                        <span style={styles.summaryValue}>{stats.totalOrders || 0}</span>
                      </div>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Ingresos Totales</span>
                        <span style={styles.summaryValue}>${stats.totalRevenue?.toLocaleString('es-CL') || 0}</span>
                      </div>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Cartas Vendidas</span>
                        <span style={styles.summaryValue}>{stats.totalCardsSold || 0}</span>
                      </div>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Promedio por Orden</span>
                        <span style={styles.summaryValue}>${stats.averageOrderValue?.toLocaleString('es-CL', {maximumFractionDigits: 0}) || 0}</span>
                      </div>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Órdenes este Mes</span>
                        <span style={styles.summaryValue}>{stats.ordersMonth || 0}</span>
                      </div>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Cartas este Mes</span>
                        <span style={styles.summaryValue}>{stats.cardsSoldMonth || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Cartas */}
                  <div style={styles.topCardsSection}>
                    <h3 style={styles.statsSubtitle}>🔥 Top Cartas Vendidas</h3>
                    <div style={styles.topCardsList}>
                      {stats.topCards?.length > 0 ? (
                        stats.topCards.slice(0, 5).map((card, idx) => (
                          <div key={card.id || idx} style={styles.topCardItem}>
                            <div style={styles.topCardRank}>#{idx + 1}</div>
                            {card.image && (
                              <img src={card.image} alt={card.name} style={styles.topCardImage} />
                            )}
                            <div style={styles.topCardInfo}>
                              <div style={styles.topCardName}>{card.name}</div>
                              <div style={styles.topCardStats}>
                                {card.quantity} vendidas · ${card.revenue?.toLocaleString('es-CL') || 0}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{color: 'var(--muted)', fontSize: '14px', textAlign: 'center', padding: '20px'}}>
                          Aún no hay ventas registradas
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ventas últimos 7 días */}
                <div style={styles.chartSection}>
                  <h3 style={styles.statsSubtitle}>📅 Ventas Últimos 7 Días</h3>
                  <div style={styles.barChart}>
                    {stats.salesByDay?.map((day, idx) => {
                      const maxRevenue = Math.max(...stats.salesByDay.map(d => d.revenue), 1);
                      const heightPercent = (day.revenue / maxRevenue) * 100;
                      return (
                        <div key={idx} style={styles.barContainer}>
                          <div style={styles.barWrapper}>
                            <div 
                              style={{
                                ...styles.bar,
                                height: `${Math.max(heightPercent, 5)}%`,
                              }}
                              title={`$${day.revenue?.toLocaleString('es-CL') || 0}`}
                            />
                          </div>
                          <div style={styles.barLabel}>{day.dayName}</div>
                          <div style={styles.barValue}>${(day.revenue || 0).toLocaleString('es-CL', {notation: 'compact'})}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Estado de órdenes */}
                <div style={styles.orderStatusSection}>
                  <h3 style={styles.statsSubtitle}>📋 Estado de Órdenes</h3>
                  <div style={styles.statusGrid}>
                    <div style={{...styles.statusCard, borderLeftColor: '#f59e0b'}}>
                      <div style={styles.statusCount}>{stats.orderStatuses?.pending || 0}</div>
                      <div style={styles.statusLabel}>Pendientes</div>
                    </div>
                    <div style={{...styles.statusCard, borderLeftColor: '#10b981'}}>
                      <div style={styles.statusCount}>{stats.orderStatuses?.paid || 0}</div>
                      <div style={styles.statusLabel}>Pagadas</div>
                    </div>
                    <div style={{...styles.statusCard, borderLeftColor: '#3b82f6'}}>
                      <div style={styles.statusCount}>{stats.orderStatuses?.shipped || 0}</div>
                      <div style={styles.statusLabel}>Enviadas</div>
                    </div>
                    <div style={{...styles.statusCard, borderLeftColor: '#8b5cf6'}}>
                      <div style={styles.statusCount}>{stats.orderStatuses?.delivered || 0}</div>
                      <div style={styles.statusLabel}>Entregadas</div>
                    </div>
                    <div style={{...styles.statusCard, borderLeftColor: '#ef4444'}}>
                      <div style={styles.statusCount}>{stats.orderStatuses?.cancelled || 0}</div>
                      <div style={styles.statusLabel}>Canceladas</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={fetchStats}
                  style={{...styles.filterBtn, background: 'var(--accent-purple)', color: 'white', marginTop: '16px'}}
                >
                  🔄 Actualizar Estadísticas
                </button>
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '40px', color: 'var(--muted)'}}>
                No hay datos de estadísticas disponibles
              </div>
            )
          )}
        </section>
        )}

        {/* Add Card Section */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Añadir Nueva Carta
            </h2>
          </div>
          
          <form onSubmit={addCard} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre de la carta</label>
                <input 
                  type="text"
                  placeholder="Ej: Charizard" 
                  value={newCard.name} 
                  onChange={e=>setNewCard({...newCard,name:e.target.value})} 
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Colección/Set</label>
                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                  <select
                    value={newCard.set}
                    onChange={e=>setNewCard({...newCard,set:e.target.value})}
                    style={{...styles.input, flex: 1}}
                  >
                    <option value="">Seleccione...</option>
                    {availableSets.map(s => {
                      const setName = typeof s === 'string' ? s : (s?.name || String(s));
                      const setKey = typeof s === 'string' ? s : (s?.id || s?.name || String(s));
                      return <option key={setKey} value={setName}>{setName}</option>;
                    })}
                    {uniqueSets.map(s => {
                      const setName = typeof s === 'string' ? s : (s?.name || String(s));
                      const setKey = typeof s === 'string' ? s : (s?.id || s?.name || String(s));
                      if (availableSets.some(a => {
                        const aName = typeof a === 'string' ? a : (a?.name || String(a));
                        return aName === setName;
                      })) return null;
                      return <option key={setKey} value={setName}>{setName}</option>;
                    })}
                  </select>
                  <button type="button" style={styles.addSmallBtn} onClick={()=>setShowAddSet(!showAddSet)}>
                    {showAddSet ? 'Cancelar' : 'Añadir'}
                  </button>
                </div>

                {showAddSet && (
                  <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                    <input
                      type="text"
                      placeholder="Nombre de la colección"
                      value={newSetName}
                      onChange={e=>setNewSetName(e.target.value)}
                      style={{...styles.input, flex:1}}
                    />
                    <button type="button" onClick={addNewSet} style={styles.submitBtn}>
                      Guardar
                    </button>
                  </div>
                )}
              </div>
              

              <div style={styles.formGroup}>
                <label style={styles.label}>Precio ($)</label>
                <input 
                  type="number"
                  placeholder="0.00" 
                  value={newCard.price} 
                  onChange={e=>setNewCard({...newCard,price:e.target.value})} 
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Cantidad en Stock</label>
                <input 
                  type="number"
                  placeholder="0" 
                  value={newCard.stock} 
                  onChange={e=>setNewCard({...newCard,stock:e.target.value})} 
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Imagen (URL)</label>
                <input
                  type="url"
                  placeholder="https://.../imagen.jpg"
                  value={newCard.image}
                  onChange={e => setNewCard({...newCard, image: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Rareza</label>
                <select 
                  value={newCard.rarity} 
                  onChange={e=>setNewCard({...newCard,rarity:e.target.value})} 
                  style={styles.input}
                >
                  <option>Común</option>
                  <option>Poco Común</option>
                  <option>Raro</option>
                  <option>Ultra Raro</option>
                  <option>Secreto Raro</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Idioma</label>
                <select
                  value={newCard.language}
                  onChange={e => setNewCard({...newCard, language: e.target.value})}
                  style={styles.input}
                >
                  <option>Español</option>
                  <option>Inglés</option>
                  <option>Japonés</option>
                  <option>Francés</option>
                  <option>Alemán</option>
                  <option>Italiano</option>
                  <option>Portugués</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tipo</label>
                <select
                  value={newCard.cardType}
                  onChange={e => setNewCard({...newCard, cardType: e.target.value})}
                  style={styles.input}
                >
                  <option>Pokémon</option>
                  <option>Partidario</option>
                </select>
              </div>

              {newCard.cardType === 'Partidario' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Acabado</label>
                  <select
                    value={newCard.supporterFinish}
                    onChange={e => setNewCard({...newCard, supporterFinish: e.target.value})}
                    style={styles.input}
                  >
                    <option value="">Selecciona un acabado</option>
                    <option value="Normal">Normal</option>
                    <option value="Holo">Holo</option>
                    <option value="Reverse Holo">Reverse Holo</option>
                  </select>
                </div>
              )}
            </div>

            {formError && <div style={styles.error}>{formError}</div>}
            
            <button type="submit" style={{...styles.submitBtn, marginTop: '16px', width: 'fit-content', minWidth: '200px'}}>
              Añadir Carta
            </button>
          </form>
        </section>

        {/* TCGdex Search Section */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              📱 Buscar en TCGdex
            </h2>
            <p style={styles.sectionSubtitle}>
              Busca cartas por nombre o importa sets completos desde la API de TCGdex
            </p>
          </div>
          <TCGdexSearcher onCardImported={fetchCards} styles={styles} />
        </section>

        {/* Cards Table Section */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Cartas en Inventario ({cards.length})
            </h2>
          </div>

          {cards.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateText}>No hay cartas en el inventario. ¡Añade una!</p>
            </div>
          ) : (
            <>
              {/* Filtros */}
              <div style={styles.filtersContainer}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Buscar por nombre</label>
                  <input 
                    type="text"
                    placeholder="Ej: Charizard, Pikachu..."
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                    style={styles.filterInput}
                  />
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Rareza</label>
                  <select 
                    value={filterRarity}
                    onChange={e => setFilterRarity(e.target.value)}
                    style={styles.filterInput}
                  >
                    <option value="">Todas</option>
                    {rarities.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Colección</label>
                  <select 
                    value={filterSet}
                    onChange={e => setFilterSet(e.target.value)}
                    style={styles.filterInput}
                  >
                    <option value="">Todas</option>
                    {uniqueSets.map(s => {
                      const setName = typeof s === 'string' ? s : (s?.name || String(s));
                      const setKey = typeof s === 'string' ? s : (s?.id || s?.name || String(s));
                      return <option key={setKey} value={setName}>{setName}</option>;
                    })}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Precio</label>
                  <select 
                    value={sortPrice}
                    onChange={e => setSortPrice(e.target.value)}
                    style={styles.filterInput}
                  >
                    <option value="none">Sin ordenar</option>
                    <option value="asc">Menor a Mayor</option>
                    <option value="desc">Mayor a Menor</option>
                  </select>
                </div>

                <button 
                  style={styles.resetBtn}
                  onClick={() => {
                    setSearchName('');
                    setFilterSet('');
                    setFilterRarity('');
                    setSortPrice('none');
                  }}
                >
                  Limpiar Filtros
                </button>
              </div>

              <div style={styles.resultsInfo}>
                Mostrando <strong>{filteredCards.length}</strong> de <strong>{cards.length}</strong> cartas
              </div>

              {filteredCards.length === 0 ? (
                <div style={styles.emptyState}>
                  <p style={styles.emptyStateText}>No hay cartas que coincidan con los filtros aplicados</p>
                </div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        <th style={{...styles.tableCell, width: '20%'}}>Nombre</th>
                        <th style={{...styles.tableCell, width: '12%'}}>Colección</th>
                        <th style={{...styles.tableCell, width: '11%'}}>Rareza</th>
                        <th style={{...styles.tableCell, width: '10%'}}>Precio</th>
                        <th style={{...styles.tableCell, width: '10%'}}>Ganancia</th>
                        <th style={{...styles.tableCell, width: '8%'}}>Stock</th>
                        <th style={{...styles.tableCell, width: '29%'}}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCards.map((c, idx) => (
                        <tr key={c.id} style={{...styles.tableRow, backgroundColor: idx % 2 === 0 ? '#ffffff' : 'rgba(124, 58, 237, 0.01)'}}>
                          <td style={styles.tableCell}>{c.name}</td>
                          <td style={styles.tableCell}>
                            <span style={styles.setTag}>{getSetName(c.set)}</span>
                          </td>
                          <td style={styles.tableCell}>
                            {editingRarityId === c.id ? (
                              <select
                                defaultValue={c.rarity || 'Sin Categoría'}
                                autoFocus
                                onChange={e => updateRarity(c.id, e.target.value)}
                                onBlur={() => setEditingRarityId(null)}
                                style={{...styles.input, width: '120px', cursor: 'pointer'}}
                              >
                                {RARITY_OPTIONS.map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            ) : (
                              <span 
                                style={{...styles.rarityTag, ...getRarityTagStyle(c.rarity), cursor: 'pointer'}}
                                onClick={() => setEditingRarityId(c.id)}
                                title="Click para editar rareza"
                              >
                                {c.rarity || 'Sin categoría'}
                              </span>
                            )}
                          </td>
                          <td style={styles.tableCell}>
                            {editingId === c.id ? (
                              <input 
                                type="number"
                                defaultValue={c.price} 
                                autoFocus
                                onBlur={e=>updatePrice(c.id, e.target.value)}
                                onKeyPress={e => {
                                  if (e.key === 'Enter') updatePrice(c.id, e.target.value);
                                }}
                                style={{...styles.input, width: '80px'}} 
                              />
                            ) : (
                              <span 
                                style={styles.priceDisplay}
                                onClick={() => setEditingId(c.id)}
                                title="Click para editar precio"
                              >
                                ${c.price}
                              </span>
                            )}
                          </td>
                          <td style={styles.tableCell}>
                            {editingProfitId === c.id ? (
                              <input 
                                type="number"
                                defaultValue={c.profit || 0} 
                                autoFocus
                                min="0"
                                step="0.01"
                                onBlur={e=>updateProfit(c.id, e.target.value)}
                                onKeyPress={e => {
                                  if (e.key === 'Enter') updateProfit(c.id, e.target.value);
                                }}
                                style={{...styles.input, width: '80px'}} 
                              />
                            ) : (
                              <span 
                                style={{...styles.priceDisplay, color: '#10b981'}}
                                onClick={() => setEditingProfitId(c.id)}
                                title="Click para editar ganancia"
                              >
                                ${c.profit || 0}
                              </span>
                            )}
                          </td>
                          <td style={styles.tableCell}>
                            {editingStockId === c.id ? (
                              <input 
                                type="number"
                                defaultValue={c.stock} 
                                autoFocus
                                min="0"
                                onBlur={e=>updateStock(c.id, e.target.value)}
                                onKeyPress={e => {
                                  if (e.key === 'Enter') updateStock(c.id, e.target.value);
                                }}
                                style={{...styles.input, width: '60px'}} 
                              />
                            ) : (
                              <span 
                                style={{...styles.priceDisplay, color: c.stock <= 0 ? '#ef4444' : c.stock <= 3 ? '#f59e0b' : '#10b981'}}
                                onClick={() => setEditingStockId(c.id)}
                                title="Click para editar stock"
                              >
                                {c.stock || 0}
                              </span>
                            )}
                          </td>
                          <td style={{...styles.tableCell, display: 'flex', gap: '8px'}}>
                            <button 
                              onClick={()=>deleteCard(c.id)} 
                              style={styles.deleteBtn}
                              title="Eliminar carta"
                            >
                              🗑️ Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p>Cargando panel...</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    fontFamily: "'Rajdhani', sans-serif",
  },
  header: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: 'white',
    padding: '32px 24px',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  headerTitle: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    letterSpacing: '1px',
  },
  headerSubtitle: {
    fontSize: '14px',
    opacity: 0.9,
    margin: 0,
  },
  logoutBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
  },
  adminsBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
    marginRight: '12px',
  },
  inventoryBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(100, 200, 255, 0.3)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
    marginRight: '12px',
  },
  storeBtn: {
    padding: '8px 14px',
    borderRadius: '6px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
    whiteSpace: 'nowrap',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  section: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
  },
  sectionHeader: {
    marginBottom: '24px',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f1724',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f1724',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '14px',
    fontFamily: "'Rajdhani', sans-serif",
    backgroundColor: '#f9fafb',
    color: '#0f1724',
    transition: 'all 0.3s ease',
  },
  submitBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: "'Rajdhani', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  error: {
    padding: '12px 16px',
    borderRadius: '8px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '14px',
    fontWeight: '500',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    borderBottom: '2px solid #d1d5db',
  },
  tableRow: {
    borderBottom: '1px solid #e5e7eb',
    transition: 'background-color 0.2s ease',
  },
  tableCell: {
    padding: '14px 16px',
    textAlign: 'left',
    color: '#0f1724',
  },
  setTag: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    background: '#ddd6fe',
    color: '#6d28d9',
    fontSize: '12px',
    fontWeight: '600',
  },
  priceDisplay: {
    fontWeight: '600',
    color: '#7c3aed',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: '16px',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    fontFamily: "'Rajdhani', sans-serif",
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #7c3aed',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  filtersContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
    padding: '20px',
    background: '#f9fafb',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f1724',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  filterInput: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '14px',
    fontFamily: "'Rajdhani', sans-serif",
    backgroundColor: 'white',
    color: '#0f1724',
    transition: 'all 0.3s ease',
  },
  resetBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    background: '#f3f4f6',
    color: '#6b7280',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  resultsInfo: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
    padding: '8px 0',
    fontWeight: '500',
  },
  rarityTag: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  headerActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  userMenu: {
    position: 'relative',
  },
  userMenuBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
  },
  userMenuDropdown: {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '8px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    minWidth: '350px',
    zIndex: 1000,
    overflow: 'hidden',
  },
  userMenuHeader: {
    padding: '12px 16px',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: '600',
    color: '#0f1724',
    fontSize: '14px',
  },
  usersList: {
    maxHeight: '250px',
    overflowY: 'auto',
    paddingTop: '8px',
  },
  userItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
  },
  roleTag: {
    marginLeft: '8px',
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    background: '#ddd6fe',
    color: '#6d28d9',
    fontSize: '11px',
    fontWeight: '600',
  },
  deleteUserBtn: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: 'none',
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Rajdhani', sans-serif",
  },
  userMenuDivider: {
    height: '1px',
    background: '#e5e7eb',
    margin: '8px 0',
  },
  userForm: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userFormInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '2px solid #e5e7eb',
    fontSize: '13px',
    fontFamily: "'Rajdhani', sans-serif",
    backgroundColor: '#f9fafb',
    color: '#0f1724',
  },
  userFormError: {
    padding: '8px 12px',
    borderRadius: '6px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '12px',
    fontWeight: '500',
  },
  userFormSubmit: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  addSmallBtn: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    background: '#eef2ff',
    color: '#4f46e5',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },

  // TCGdex Styles
  tcgdexContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  tcgdexTabs: {
    display: 'flex',
    gap: '12px',
    borderBottom: '2px solid #e5e7eb',
    marginBottom: '12px',
  },
  tcgdexTab: {
    padding: '12px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#9ca3af',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
  },
  tcgdexTabActive: {
    borderBottomColor: '#7c3aed',
    color: '#7c3aed',
  },
  tcgdexSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  tcgdexSearchForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  tcgdexInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '14px',
    fontFamily: "'Rajdhani', sans-serif",
  },
  tcgdexBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#7c3aed',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Rajdhani', sans-serif",
  },
  tcgdexResults: {
    marginTop: '20px',
  },
  tcgdexResultsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f1724',
    marginBottom: '12px',
  },
  tcgdexCardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px',
  },
  tcgdexCardItem: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: 'white',
    transition: 'box-shadow 0.2s',
    cursor: 'pointer',
  },
  tcgdexCardImage: {
    width: '100%',
    height: '200px',
    objectFit: 'contain',
    background: 'white',
    borderRadius: '0',
    display: 'block',
  },
  tcgdexCardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    padding: '6px 8px',
    flex: 1,
  },
  tcgdexCardName: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#0f1724',
    margin: 0,
    lineHeight: '1.1',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tcgdexCardMeta: {
    fontSize: '10px',
    color: '#6b7280',
    margin: 0,
  },
  tcgdexCardRarity: {
    fontSize: '10px',
    color: '#7c3aed',
    fontWeight: '600',
    margin: 0,
  },
  tcgdexImportForm: {
    display: 'flex',
    gap: '4px',
  },
  tcgdexSmallInput: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    fontSize: '11px',
  },
  tcgdexImportBtn: {
    width: '35px',
    height: '35px',
    borderRadius: '4px',
    border: 'none',
    background: '#10b981',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  tcgdexSetCards: {
    marginTop: '20px',
  },
  tcgdexSetCardsBtnGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  tcgdexSelectAllBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '2px solid #7c3aed',
    background: 'white',
    color: '#7c3aed',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Rajdhani', sans-serif",
  },
  tcgdexImportAllBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    background: '#10b981',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Rajdhani', sans-serif",
  },
  tcgdexSetCardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '400px',
    overflowY: 'auto',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  tcgdexSetCardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  tcgdexCheckbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  tcgdexSetCardName: {
    flex: 1,
    fontSize: '13px',
    fontWeight: '500',
    color: '#0f1724',
  },
  tcgdexSetCardRarity: {
    fontSize: '12px',
    color: '#7c3aed',
    fontWeight: '600',
    minWidth: '80px',
  },
  tcgdexSetCardInput: {
    width: '100px',
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    fontSize: '12px',
  },
  // Statistics styles
  statsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  statCardIcon: {
    fontSize: '32px',
  },
  statCardContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statCardValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f1724',
    lineHeight: 1.2,
  },
  statCardLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  statsSummary: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  statsSubtitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f1724',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: 'white',
    borderRadius: '8px',
    fontSize: '13px',
  },
  summaryLabel: {
    color: '#6b7280',
  },
  summaryValue: {
    fontWeight: '700',
    color: '#0f1724',
  },
  topCardsSection: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  topCardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  topCardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    background: 'white',
    borderRadius: '8px',
  },
  topCardRank: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0,
  },
  topCardImage: {
    width: '40px',
    height: '56px',
    objectFit: 'cover',
    borderRadius: '4px',
    flexShrink: 0,
  },
  topCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  topCardName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f1724',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  topCardStats: {
    fontSize: '11px',
    color: '#6b7280',
  },
  chartSection: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  barChart: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '180px',
    gap: '12px',
    paddingTop: '20px',
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    gap: '8px',
  },
  barWrapper: {
    width: '100%',
    height: '120px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: '50px',
    background: 'linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%)',
    borderRadius: '6px 6px 0 0',
    transition: 'height 0.3s ease',
  },
  barLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  barValue: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#0f1724',
  },
  orderStatusSection: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
  },
  statusCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    borderLeft: '4px solid #6b7280',
    textAlign: 'center',
  },
  statusCount: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f1724',
  },
  statusLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
    marginTop: '4px',
  },
  
  // Admin Section Styles
  adminSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  adminListContainer: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  adminList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  adminCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: 'white',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
  },
  adminCardInfo: {
    flex: 1,
  },
  adminCardName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f1724',
  },
  adminCardEmail: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '2px',
  },
  adminCardRole: {
    flexShrink: 0,
  },
  adminDeleteBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Rajdhani', sans-serif",
  },
  adminFormContainer: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  adminForm: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  adminFormRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  adminFormGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  adminFormLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f1724',
  },
  adminFormInput: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '14px',
    fontFamily: "'Rajdhani', sans-serif",
    backgroundColor: 'white',
    color: '#0f1724',
    transition: 'all 0.3s ease',
  },
  adminFormError: {
    padding: '10px 14px',
    borderRadius: '8px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: '500',
  },
  adminFormActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  adminFormSubmit: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  adminRolesInfo: {
    marginTop: '20px',
    padding: '16px',
    background: '#eef2ff',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#4f46e5',
    lineHeight: '1.6',
  },
};

