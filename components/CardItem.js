import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function CardItem({ card }) {
  const [hovered, setHovered] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addItem } = useCart();

  const inc = () => {
    if (card.stock !== undefined && quantity >= card.stock) return;
    setQuantity(q => q + 1);
  };

  const dec = () => {
    setQuantity(q => Math.max(0, q - 1));
  };

  const handleAddToCart = () => {
    if (quantity > 0) {
      addItem(card, quantity);
      setAddedFeedback(true);
      setQuantity(0);
      setTimeout(() => setAddedFeedback(false), 2000);
    }
  };

  const imgSrc = card.image || card.imageUrl || null;

  // Helper para obtener nombre del set (puede ser string u objeto)
  const getSetName = (set) => {
    if (!set) return 'Unknown';
    if (typeof set === 'string') return set;
    if (typeof set === 'object' && set.name) return set.name;
    return 'Unknown';
  };

  return (
    <div
      style={{
        ...styles.card,
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 18px 40px rgba(2,6,23,0.12)'
          : '0 6px 18px rgba(2,6,23,0.06)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.imageWrap}>
        {imgSrc && !imageError ? (
          <>
            {/* Placeholder blur mientras carga */}
            {!imageLoaded && (
              <div style={styles.imagePlaceholder}>
                <div style={styles.spinner}></div>
              </div>
            )}
            <img 
              src={imgSrc} 
              alt={card.name} 
              style={{
                ...styles.image,
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
              }}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              decoding="async"
            />
          </>
        ) : (
          <div style={styles.imagePlaceholder}>
            <span style={styles.placeholderIcon}>🃏</span>
          </div>
        )}
      </div>

      <div style={styles.infoCompact}>
        <div style={styles.titleRow}>
          <h3 style={styles.name}>{card.name}</h3>
        </div>
        <div style={styles.secondRow}>
          <div style={styles.setAndNumber}>
            <div style={styles.setText}>{getSetName(card.set)}</div>
            {card.number && <div style={styles.cardNumber}>{card.number}</div>}
          </div>
        </div>

        <div style={styles.priceRow}>
          <div>
            {card.originalPrice && (
              <div style={styles.originalPrice}>${Number(card.originalPrice).toLocaleString('es-CL')} CLP</div>
            )}
            <div style={styles.price}>${Number(card.price).toLocaleString('es-CL')} CLP</div>
          </div>

          <div style={styles.qtyControls}>
            <button style={styles.qtyBtn} onClick={dec} aria-label="Disminuir">−</button>
            <div style={styles.qtyDisplay}>{quantity}</div>
            <button style={styles.qtyBtn} onClick={inc} aria-label="Aumentar">+</button>
          </div>
        </div>

        <button
          style={{
            ...styles.addToCartBtn,
            ...(addedFeedback ? styles.addedFeedback : {}),
            opacity: quantity === 0 ? 0.5 : 1,
          }}
          onClick={handleAddToCart}
          disabled={quantity === 0}
        >
          {addedFeedback ? '✓ Agregado' : 'Agregar al Carrito'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
  },
  imageWrap: {
    position: 'relative',
    height: '240px',
    background: '#fafafa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: '8px',
  },
  imagePlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    fontSize: '60px',
    color: 'var(--muted)',
    opacity: 0.6,
  },
  infoCompact: {
    padding: '10px 12px 12px 12px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  secondRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  setAndNumber: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    color: 'var(--muted)',
    fontSize: '12px',
  },
  setText: {
    color: 'var(--muted)',
    fontSize: '11px',
    fontWeight: '600',
  },
  cardNumber: {
    fontSize: '12px',
    color: 'var(--muted)',
  },
  name: {
    fontSize: '14px',
    fontFamily: "'Bebas Neue', sans-serif",
    letterSpacing: '0.5px',
    color: 'var(--text)',
    marginBottom: '2px',
    margin: '0',
    lineHeight: '1.1',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  originalPrice: {
    fontSize: '12px',
    color: '#7a7a9a',
    textDecoration: 'line-through',
    marginBottom: '2px',
  },
  price: {
    fontSize: '16px',
    fontFamily: "'Bebas Neue', sans-serif",
    color: 'var(--accent-purple)',
    letterSpacing: '0.5px',
    fontWeight: '700',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #e5e7eb',
    padding: '4px',
    borderRadius: '6px',
    background: '#fff',
  },
  qtyBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '4px',
    border: 'none',
    background: 'transparent',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  qtyDisplay: {
    minWidth: '38px',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: '14px',
  },
  addToCartBtn: {
    width: '100%',
    marginTop: '12px',
    padding: '10px 12px',
    background: 'var(--accent-purple)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.15s',
    fontFamily: "'Bebas Neue', sans-serif",
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  addedFeedback: {
    background: '#10b981',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(124, 58, 237, 0.2)',
    borderTop: '3px solid var(--accent-purple)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

// Agregar estilos de animación
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
