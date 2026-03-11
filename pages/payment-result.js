import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PaymentResult() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderInfo, setOrderInfo] = useState(null);
  const { status, data, code, message, method, orderCode } = router.query;

  useEffect(() => {
    // Si el pago fue exitoso, limpiar el carrito
    if (status === 'success') {
      clearCart();
      
      // Decodificar datos de la orden si vienen de WebPay
      if (data) {
        try {
          const decoded = JSON.parse(decodeURIComponent(data));
          setOrderInfo(decoded);
        } catch (e) {
          console.error('Error decodificando datos:', e);
        }
      }
    }
  }, [status, data, clearCart]);

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: '✅',
          title: '¡Pago Exitoso!',
          message: 'Tu compra ha sido procesada correctamente. Te enviamos un email con los detalles.',
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
        };
      case 'rejected':
        return {
          icon: '❌',
          title: 'Pago Rechazado',
          message: 'Tu pago no pudo ser procesado. Por favor intenta con otro método de pago.',
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
        };
      case 'pending':
        return {
          icon: '⏳',
          title: 'Pago Pendiente',
          message: 'Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.',
          color: '#f59e0b',
          bgColor: 'rgba(245, 158, 11, 0.1)',
        };
      case 'cancelled':
        return {
          icon: '🚫',
          title: 'Pago Cancelado',
          message: 'El proceso de pago fue cancelado.',
          color: '#6b7280',
          bgColor: 'rgba(107, 114, 128, 0.1)',
        };
      case 'error':
        return {
          icon: '⚠️',
          title: 'Error en el Pago',
          message: message || 'Ocurrió un error durante el proceso de pago.',
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
        };
      default:
        return {
          icon: '❓',
          title: 'Estado Desconocido',
          message: 'No pudimos determinar el estado de tu pago.',
          color: '#6b7280',
          bgColor: 'rgba(107, 114, 128, 0.1)',
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Obtener el código de orden de múltiples fuentes
  const displayOrderCode = orderInfo?.orderCode || orderCode || orderInfo?.buyOrder;

  return (
    <>
      <Head>
        <title>Resultado del Pago — Carta Suelta</title>
      </Head>

      <Navbar />

      <main style={styles.main}>
        <div style={styles.container}>
          <div style={{
            ...styles.card,
            borderColor: statusConfig.color,
          }}>
            <div style={{
              ...styles.iconWrapper,
              background: statusConfig.bgColor,
            }}>
              <span style={styles.icon}>{statusConfig.icon}</span>
            </div>

            <h1 style={{...styles.title, color: statusConfig.color}}>
              {statusConfig.title}
            </h1>

            <p style={styles.message}>{statusConfig.message}</p>

            {/* Mostrar código de orden prominentemente */}
            {status === 'success' && displayOrderCode && (
              <div style={styles.orderCodeBox}>
                <p style={styles.orderCodeLabel}>Tu código de pedido:</p>
                <p style={styles.orderCode}>{displayOrderCode}</p>
                <p style={styles.orderCodeHint}>Guarda este código para consultar el estado de tu pedido</p>
              </div>
            )}

            {/* Mostrar detalles de la transacción WebPay */}
            {status === 'success' && orderInfo && method !== 'mercadopago' && (
              <div style={styles.orderDetails}>
                <h3 style={styles.detailsTitle}>Detalles de la Transacción</h3>
                <div style={styles.detailRow}>
                  <span>Monto:</span>
                  <span style={styles.detailValue}>
                    ${Number(orderInfo.amount).toLocaleString('es-CL')} CLP
                  </span>
                </div>
                {orderInfo.authorizationCode && (
                  <div style={styles.detailRow}>
                    <span>Código de Autorización:</span>
                    <span style={styles.detailValue}>{orderInfo.authorizationCode}</span>
                  </div>
                )}
                {orderInfo.cardNumber && (
                  <div style={styles.detailRow}>
                    <span>Tarjeta:</span>
                    <span style={styles.detailValue}>**** {orderInfo.cardNumber}</span>
                  </div>
                )}
                {orderInfo.transactionDate && (
                  <div style={styles.detailRow}>
                    <span>Fecha:</span>
                    <span style={styles.detailValue}>
                      {new Date(orderInfo.transactionDate).toLocaleString('es-CL')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Confirmación de Mercado Pago */}
            {status === 'success' && method === 'mercadopago' && (
              <div style={styles.orderDetails}>
                <p style={styles.mpSuccess}>
                  ✉️ Revisa tu email para ver los detalles completos de tu pedido.
                </p>
              </div>
            )}

            {/* Código de error si fue rechazado */}
            {status === 'rejected' && code && (
              <p style={styles.errorCode}>Código de error: {code}</p>
            )}

            <div style={styles.actions}>
              {status === 'success' ? (
                <>
                  <Link href="/orders" style={styles.primaryBtn}>
                    Ver Mis Pedidos
                  </Link>
                  <Link href="/" style={styles.secondaryBtn}>
                    Seguir Comprando
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/checkout" style={styles.primaryBtn}>
                    Intentar de Nuevo
                  </Link>
                  <Link href="/" style={styles.secondaryBtn}>
                    Volver al Inicio
                  </Link>
                </>
              )}
              <Link href="/" style={{...styles.secondaryBtn, background: '#f3f4f6', color: '#ef4444', borderColor: '#ef4444'}}>
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: '120px',
    paddingBottom: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    maxWidth: '500px',
    width: '100%',
    padding: '0 20px',
  },
  card: {
    background: 'var(--card-bg)',
    borderRadius: '20px',
    border: '2px solid var(--border)',
    padding: '40px',
    textAlign: 'center',
  },
  iconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  icon: {
    fontSize: '40px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '12px',
  },
  message: {
    fontSize: '16px',
    color: 'var(--muted)',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  orderCodeBox: {
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  orderCodeLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '8px',
  },
  orderCode: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'white',
    letterSpacing: '2px',
    marginBottom: '8px',
  },
  orderCodeHint: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  orderDetails: {
    background: 'var(--bg)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  detailsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    color: 'var(--muted)',
  },
  detailValue: {
    fontWeight: '500',
    color: 'var(--text)',
  },
  mpSuccess: {
    textAlign: 'center',
    color: 'var(--text)',
    fontSize: '14px',
  },
  errorCode: {
    fontSize: '12px',
    color: 'var(--muted)',
    marginBottom: '24px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  primaryBtn: {
    display: 'block',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    border: 'none',
    borderRadius: '12px',
    textDecoration: 'none',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  secondaryBtn: {
    display: 'block',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: 'var(--text)',
    background: 'transparent',
    border: '2px solid var(--border)',
    borderRadius: '12px',
    textDecoration: 'none',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
