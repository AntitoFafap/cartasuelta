import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Query GraphQL para obtener órdenes del usuario (usando fetch directo)
async function fetchUserOrders(userId) {
  const response = await fetch('/api/orders/user', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Error fetching orders');
  }
  return response.json();
}

export default function Orders() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login?redirect=/orders');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders();
    }
  }, [isAuthenticated, user]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    setError('');
    try {
      const data = await fetchUserOrders(user.id);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error al cargar los pedidos');
    } finally {
      setOrdersLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pendiente', bg: '#fef3c7', color: '#92400e' },
      paid: { label: 'Pagado', bg: '#d1fae5', color: '#065f46' },
      shipped: { label: 'Enviado', bg: '#dbeafe', color: '#1e40af' },
      delivered: { label: 'Entregado', bg: '#d1fae5', color: '#065f46' },
      cancelled: { label: 'Cancelado', bg: '#fee2e2', color: '#991b1b' },
    };
    return config[status] || { label: status, bg: '#f3f4f6', color: '#374151' };
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      webpay: 'WebPay',
      mercadopago: 'Mercado Pago',
    };
    return labels[method] || method || 'N/A';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Cargando...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Mis Pedidos — Carta Suelta</title>
      </Head>

      <Navbar />

      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>Mis Pedidos</h1>
            <p style={styles.subtitle}>Historial de todas tus compras</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <p>{error}</p>
            </div>
          )}

          {ordersLoading ? (
            <div style={styles.loadingContent}>
              <div style={styles.spinner}></div>
              <p>Cargando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📦</div>
              <h2 style={styles.emptyTitle}>No tienes pedidos aún</h2>
              <p style={styles.emptyText}>¡Comienza a comprar cartas Pokémon ahora!</p>
              <button
                onClick={() => router.push('/')}
                style={styles.primaryButton}
              >
                Ir a la tienda
              </button>
            </div>
          ) : (
            <div style={styles.ordersGrid}>
              {orders.map((order) => {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                const statusConfig = getStatusBadge(order.status);
                
                return (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <div>
                        <p style={styles.orderCode}>{order.orderCode}</p>
                        <p style={styles.orderDate}>
                          {new Date(order.createdAt).toLocaleDateString('es-CL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span style={{
                        ...styles.statusBadge,
                        background: statusConfig.bg,
                        color: statusConfig.color,
                      }}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div style={styles.orderItems}>
                      {Array.isArray(items) && items.slice(0, 3).map((item, idx) => (
                        <div key={idx} style={styles.itemRow}>
                          <span style={styles.itemName}>{item.name}</span>
                          <span style={styles.itemQty}>x{item.quantity}</span>
                        </div>
                      ))}
                      {Array.isArray(items) && items.length > 3 && (
                        <p style={styles.moreItems}>+{items.length - 3} más...</p>
                      )}
                    </div>

                    <div style={styles.orderFooter}>
                      <div style={styles.paymentInfo}>
                        <span style={styles.paymentLabel}>Pago:</span>
                        <span style={styles.paymentMethod}>{getPaymentMethodLabel(order.paymentMethod)}</span>
                      </div>
                      <div style={styles.totalPrice}>
                        ${Number(order.totalPrice).toLocaleString('es-CL')} CLP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: '100px',
    paddingBottom: '60px',
  },
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--text)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: 'var(--muted)',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: 'var(--muted)',
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '16px',
    color: 'var(--muted)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--border)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '12px',
    padding: '16px',
    color: '#ef4444',
    marginBottom: '24px',
    textAlign: 'center',
  },
  emptyState: {
    background: 'var(--card-bg)',
    borderRadius: '20px',
    border: '1px solid var(--border)',
    padding: '60px 40px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '8px',
  },
  emptyText: {
    color: 'var(--muted)',
    marginBottom: '24px',
  },
  primaryButton: {
    display: 'inline-block',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  ordersGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  orderCard: {
    background: 'var(--card-bg)',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px',
    borderBottom: '1px solid var(--border)',
  },
  orderCode: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text)',
    marginBottom: '4px',
  },
  orderDate: {
    fontSize: '13px',
    color: 'var(--muted)',
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  orderItems: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  itemName: {
    fontSize: '14px',
    color: 'var(--text)',
  },
  itemQty: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--primary)',
  },
  moreItems: {
    fontSize: '13px',
    color: 'var(--muted)',
    fontStyle: 'italic',
    marginTop: '8px',
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'var(--bg)',
  },
  paymentInfo: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
  },
  paymentLabel: {
    color: 'var(--muted)',
  },
  paymentMethod: {
    color: 'var(--text)',
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text)',
  },
};
