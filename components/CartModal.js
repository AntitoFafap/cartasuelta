import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router';

export default function CartModal() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, getTotalPrice } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    setIsOpen(false);
    router.push('/checkout');
  };

  // Helper para obtener nombre del set (puede ser string u objeto)
  const getSetName = (set) => {
    if (!set) return 'Unknown';
    if (typeof set === 'string') return set;
    if (typeof set === 'object' && set.name) return set.name;
    return 'Unknown';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={styles.overlay}
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Tu Carrito de Compras</h2>
          <button
            style={styles.closeBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        <div style={styles.content}>
          {items.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyIcon}>🛒</p>
              <p style={styles.emptyText}>Tu carrito está vacío</p>
              <p style={styles.emptySubtext}>Añade cartas para comenzar</p>
            </div>
          ) : (
            <div style={styles.itemsList}>
              {items.map(item => {
                const imgSrc = item.image || item.imageUrl;
                return (
                <div key={item.id} style={styles.cartItem}>
                  <div style={styles.itemImage}>
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={styles.imagePlaceholder}>🃏</div>
                    )}
                  </div>

                  <div style={styles.itemInfo}>
                    <h3 style={styles.itemName}>{item.name}</h3>
                    <p style={styles.itemSet}>{getSetName(item.set)}</p>
                    <p style={styles.itemPrice}>
                      ${Number(item.price).toLocaleString('es-CL')} CLP
                    </p>
                  </div>

                  <div style={styles.itemControls}>
                    <div style={styles.quantityControl}>
                      <button
                        style={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Disminuir"
                      >
                        −
                      </button>
                      <span style={styles.qtyValue}>{item.quantity}</span>
                      <button
                        style={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Aumentar"
                      >
                        +
                      </button>
                    </div>

                    <p style={styles.subtotal}>
                      ${Number(item.price * item.quantity).toLocaleString('es-CL')} CLP
                    </p>

                    <button
                      style={styles.removeBtn}
                      onClick={() => removeItem(item.id)}
                      aria-label="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div style={styles.footer}>
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total:</span>
              <span style={styles.totalAmount}>
                ${Number(getTotalPrice()).toLocaleString('es-CL')} CLP
              </span>
            </div>
            <button style={styles.checkoutBtn} onClick={handleCheckout}>
              Proceder al Pago
            </button>
            <button
              style={styles.continueShoppingBtn}
              onClick={() => setIsOpen(false)}
            >
              Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 998,
  },
  modal: {
    position: 'fixed',
    right: 0,
    top: 0,
    bottom: 0,
    width: 'min(100%, 500px)',
    background: 'var(--card-bg)',
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 999,
    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
    animation: 'slideInRight 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid var(--border)',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text)',
    fontFamily: "'Inter', sans-serif",
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: 'var(--text)',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'background 0.2s',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '64px',
    margin: 0,
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text)',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: 'var(--muted)',
    margin: 0,
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cartItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    background: 'var(--surface)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    background: '#fafafa',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    fontSize: '32px',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
    fontFamily: "'Inter', sans-serif",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemSet: {
    margin: '0 0 4px 0',
    fontSize: '11px',
    color: 'var(--muted)',
  },
  itemPrice: {
    margin: 0,
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--accent-purple)',
  },
  itemControls: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '2px',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    color: 'var(--text)',
    borderRadius: '4px',
    transition: 'background 0.2s',
  },
  qtyValue: {
    minWidth: '24px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '700',
  },
  subtotal: {
    margin: 0,
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--accent-purple)',
  },
  removeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border)',
  },
  totalLabel: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--muted)',
  },
  totalAmount: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--accent-purple)',
    fontFamily: "'Inter', sans-serif",
  },
  checkoutBtn: {
    width: '100%',
    padding: '12px',
    background: 'var(--accent-purple)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'opacity 0.2s, transform 0.2s',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  continueShoppingBtn: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: 'var(--accent-purple)',
    border: '1px solid var(--accent-purple)',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
};
