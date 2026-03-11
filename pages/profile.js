import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function Profile() {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
    // Load addresses from localStorage
    const savedAddresses = localStorage.getItem('userAddresses');
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const handleSaveName = () => {
    if (newName.trim()) {
      // TODO: Implement API call to update user name
      setEditingName(false);
      setNewName('');
    }
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newAddress = {
      id: Date.now(),
      street: formData.get('street'),
      city: formData.get('city'),
      state: formData.get('state'),
      zipCode: formData.get('zipCode'),
    };
    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
    setShowAddressForm(false);
    e.target.reset();
  };

  const handleRemoveAddress = (id) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
  };

  const userEmail = user?.signInUserSession?.idToken?.payload?.email || user?.username;
  const userName = user?.signInUserSession?.idToken?.payload?.given_name || 'Usuario';
  const userLastName = user?.signInUserSession?.idToken?.payload?.family_name || '';

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Perfil</h1>
        </div>

        {/* Nombre Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Nombre</h2>
            <button
              onClick={() => {
                setEditingName(!editingName);
                setNewName(userName);
              }}
              style={styles.editButton}
              onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
              onMouseOut={(e) => e.target.style.background = 'none'}
              title="Editar nombre"
            >
              ✏️
            </button>
          </div>
          {editingName ? (
            <div style={styles.editForm}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre"
                style={styles.input}
              />
              <div style={styles.editActions}>
                <button onClick={handleSaveName} style={styles.saveBtn}>
                  Guardar
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  style={styles.cancelBtn}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p style={styles.sectionContent}>
              {userName} {userLastName}
            </p>
          )}
        </div>

        {/* Addresses Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Direcciones</h2>
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              style={styles.addButton}
            >
              + Agregar
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleAddAddress} style={styles.addressForm}>
              <input
                type="text"
                name="street"
                placeholder="Calle y número"
                required
                style={styles.input}
              />
              <input
                type="text"
                name="city"
                placeholder="Ciudad"
                required
                style={styles.input}
              />
              <input
                type="text"
                name="state"
                placeholder="Provincia"
                required
                style={styles.input}
              />
              <input
                type="text"
                name="zipCode"
                placeholder="Código postal"
                required
                style={styles.input}
              />
              <div style={styles.editActions}>
                <button type="submit" style={styles.saveBtn}>
                  Guardar dirección
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  style={styles.cancelBtn}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {addresses.length === 0 && !showAddressForm ? (
            <p style={styles.emptyMessage}>No se agregaron direcciones.</p>
          ) : (
            <div style={styles.addressList}>
              {addresses.map((addr) => (
                <div key={addr.id} style={styles.addressItem}>
                  <div>
                    <p style={styles.addressText}>{addr.street}</p>
                    <p style={styles.addressText}>
                      {addr.city}, {addr.state} {addr.zipCode}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveAddress(addr.id)}
                    style={styles.removeBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button
            onClick={() => router.push('/orders')}
            style={styles.primaryButton}
          >
            Ver Mis Pedidos
          </button>
          <button
            onClick={() => router.push('/')}
            style={styles.secondaryButton}
          >
            Volver al Home
          </button>
          <button onClick={handleLogout} style={styles.dangerButton}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#fafafa',
    padding: '20px',
    fontFamily: '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  wrapper: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    fontFamily: '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  header: {
    padding: '32px',
    borderBottom: '1px solid #e5e5e5',
    background: '#ffffff',
  },
  title: {
    margin: '0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: '-0.5px',
  },
  section: {
    padding: '32px',
    borderBottom: '1px solid #e5e5e5',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: '0',
    fontSize: '18px',
    fontWeight: '800',
    color: '#000000',
    letterSpacing: '-0.3px',
  },
  sectionContent: {
    margin: '12px 0 0 0',
    fontSize: '17px',
    color: '#1a1a1a',
    lineHeight: '1.7',
    fontWeight: '400',
  },
  editButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: '6px',
    transition: 'background 0.15s ease',
    fontWeight: '500',
  },
  addButton: {
    background: 'none',
    border: 'none',
    color: '#0066cc',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    padding: '0',
    transition: 'color 0.2s ease',
    textTransform: 'uppercase',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '16px',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    fontSize: '16px',
    fontFamily: 'inherit',
    fontWeight: '400',
    transition: 'border-color 0.2s ease',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  editActions: {
    display: 'flex',
    gap: '10px',
  },
  saveBtn: {
    padding: '12px 18px',
    background: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  cancelBtn: {
    padding: '12px 18px',
    background: '#f5f5f5',
    color: '#1a1a1a',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  addressForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '16px',
    padding: '18px',
    background: '#f9f9f9',
    borderRadius: '6px',
    border: '1px solid #e5e5e5',
  },
  addressList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  addressItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px',
    background: '#f9f9f9',
    borderRadius: '6px',
    borderLeft: '4px solid #0066cc',
  },
  addressText: {
    margin: '0 0 6px 0',
    fontSize: '16px',
    color: '#1a1a1a',
    fontWeight: '400',
    lineHeight: '1.6',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px 8px',
    fontWeight: '600',
  },
  emptyMessage: {
    margin: '12px 0 0 0',
    fontSize: '15px',
    color: '#888888',
    fontWeight: '400',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexDirection: 'column',
    padding: '32px',
  },
  primaryButton: {
    padding: '14px 18px',
    background: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  secondaryButton: {
    padding: '14px 18px',
    background: '#f5f5f5',
    color: '#1a1a1a',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  dangerButton: {
    padding: '14px 18px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
};
