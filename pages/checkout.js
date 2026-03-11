import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

export default function Checkout() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Redirigir si no hay items
  useEffect(() => {
    if (!authLoading && items.length === 0) {
      router.push('/');
    }
  }, [items, authLoading, router]);

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [isAuthenticated, authLoading, router]);

  const total = getTotalPrice();

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Por favor selecciona un método de pago');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      const orderData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
        paymentMethod: selectedMethod,
      };

      if (selectedMethod === 'webpay') {
        // Crear transacción WebPay
        const res = await fetch('/api/payments/webpay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(orderData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Error al crear transacción');
        }

        // Redirigir a WebPay
        window.location.href = data.url + '?token_ws=' + data.token;

      } else if (selectedMethod === 'mercadopago') {
        // Crear preferencia de Mercado Pago
        const res = await fetch('/api/payments/mercadopago/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(orderData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Error al crear preferencia');
        }

        // Redirigir a Mercado Pago
        window.location.href = data.init_point;
      }

    } catch (err) {
      console.error('Error procesando pago:', err);
      setError(err.message || 'Error al procesar el pago. Intenta de nuevo.');
      setProcessing(false);
    }
  };

  if (authLoading || items.length === 0) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout — Carta Suelta</title>
        <meta name="description" content="Finaliza tu compra de cartas Pokémon TCG" />
      </Head>


      <main style={styles.main}>
        <div style={styles.container}>
          <h1 style={styles.title}>Finalizar Compra</h1>

          <div style={styles.grid}>
            {/* Resumen del pedido */}
            <div style={styles.orderSummary}>
              <h2 style={styles.sectionTitle}>Resumen del Pedido</h2>
              
              <div style={styles.itemsList}>
                {items.map(item => {
                  const imgSrc = item.image || item.imageUrl;
                  return (
                  <div key={item.id} style={styles.item}>
                    <div style={styles.itemImage}>
                      {imgSrc ? (
                        <img src={imgSrc} alt={item.name} style={styles.img} />
                      ) : (
                        <div style={styles.placeholder}>🃏</div>
                      )}
                    </div>
                    <div style={styles.itemDetails}>
                      <p style={styles.itemName}>{item.name}</p>
                      <p style={styles.itemQty}>Cantidad: {item.quantity}</p>
                    </div>
                    <p style={styles.itemPrice}>
                      ${Number(item.price * item.quantity).toLocaleString('es-CL')}
                    </p>
                  </div>
                );})}
              </div>

              <div style={styles.totalSection}>
                <div style={styles.totalRow}>
                  <span>Subtotal:</span>
                  <span>${Number(total).toLocaleString('es-CL')} CLP</span>
                </div>
                <div style={styles.totalRow}>
                  <span>Envío:</span>
                  <span style={{color: '#10b981'}}>Gratis</span>
                </div>
                <div style={{...styles.totalRow, ...styles.totalFinal}}>
                  <span>Total:</span>
                  <span>${Number(total).toLocaleString('es-CL')} CLP</span>
                </div>
              </div>
            </div>

            {/* Métodos de pago */}
            <div style={styles.paymentSection}>
              <h2 style={styles.sectionTitle}>Método de Pago</h2>

              <div style={styles.paymentMethods}>
                {/* WebPay */}
                <button
                  style={{
                    ...styles.paymentOption,
                    borderColor: selectedMethod === 'webpay' ? '#7c3aed' : 'var(--border)',
                    background: selectedMethod === 'webpay' ? 'rgba(124, 58, 237, 0.1)' : 'var(--card-bg)',
                  }}
                  onClick={() => setSelectedMethod('webpay')}
                >
                  <div style={styles.paymentLogo}>
                    <img 
                      src="https://www.transbank.cl/wp-content/uploads/2019/04/webpay-logo.png" 
                      alt="WebPay" 
                      style={{ maxHeight: '40px', width: 'auto' }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                  <div style={styles.paymentInfo}>
                    <p style={styles.paymentName}>WebPay</p>
                    <p style={styles.paymentDesc}>Tarjeta de crédito o débito</p>
                  </div>
                  {selectedMethod === 'webpay' && (
                    <span style={styles.checkmark}>✓</span>
                  )}
                </button>

                {/* Mercado Pago */}
                <button
                  style={{
                    ...styles.paymentOption,
                    borderColor: selectedMethod === 'mercadopago' ? '#7c3aed' : 'var(--border)',
                    background: selectedMethod === 'mercadopago' ? 'rgba(124, 58, 237, 0.1)' : 'var(--card-bg)',
                  }}
                  onClick={() => setSelectedMethod('mercadopago')}
                >
                  <div style={styles.paymentLogo}>
                    <img 
                      src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png" 
                      alt="Mercado Pago" 
                      style={{ maxHeight: '40px', width: 'auto' }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                  <div style={styles.paymentInfo}>
                    <p style={styles.paymentName}>Mercado Pago</p>
                    <p style={styles.paymentDesc}>Tarjeta, transferencia o efectivo</p>
                  </div>
                  {selectedMethod === 'mercadopago' && (
                    <span style={styles.checkmark}>✓</span>
                  )}
                </button>
              </div>

              {error && (
                <p style={styles.error}>{error}</p>
              )}

              <button
                style={{
                  ...styles.payBtn,
                  opacity: processing ? 0.7 : 1,
                  cursor: processing ? 'not-allowed' : 'pointer',
                }}
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span style={styles.btnSpinner}></span>
                    Procesando...
                  </>
                ) : (
                  `Pagar $${Number(total).toLocaleString('es-CL')} CLP`
                )}
              </button>
              <button
                style={{
                  ...styles.payBtn,
                  background: '#f3f4f6',
                  color: '#ef4444',
                  border: '2px solid #ef4444',
                  marginTop: '12px',
                }}
                onClick={() => router.push('/')}
                disabled={processing}
              >
                Cancelar
              </button>

              <p style={styles.secureNote}>
                🔒 Pago seguro. Tus datos están protegidos.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

const styles = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--text)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--border)',
    borderTopColor: '#7c3aed',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  main: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: '100px',
    paddingBottom: '60px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  },
  title: {
    fontSize: 'clamp(28px, 4vw, 42px)',
    fontFamily: "'Bebas Neue', sans-serif",
    color: 'var(--text)',
    marginBottom: '40px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '40px',
  },
  orderSummary: {
    background: 'var(--card-bg)',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '20px',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'var(--bg)',
    borderRadius: '8px',
  },
  itemImage: {
    width: '60px',
    height: '80px',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: 'var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  placeholder: {
    fontSize: '24px',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text)',
    marginBottom: '4px',
  },
  itemQty: {
    fontSize: '12px',
    color: 'var(--muted)',
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#7c3aed',
  },
  totalSection: {
    borderTop: '1px solid var(--border)',
    paddingTop: '16px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    color: 'var(--muted)',
  },
  totalFinal: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text)',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid var(--border)',
  },
  paymentSection: {
    background: 'var(--card-bg)',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    padding: '24px',
  },
  paymentMethods: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid var(--border)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    textAlign: 'left',
  },
  paymentLogo: {
    width: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '2px',
  },
  paymentDesc: {
    fontSize: '13px',
    color: 'var(--muted)',
  },
  checkmark: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#7c3aed',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    marginBottom: '16px',
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
  },
  payBtn: {
    width: '100%',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  btnSpinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  secureNote: {
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--muted)',
    marginTop: '16px',
  },
};
