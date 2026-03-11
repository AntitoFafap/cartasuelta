import { useState, useEffect } from 'react';

export default function HeroSection() {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Cargar cartas del inventario
  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await fetch('/api/inventory');
        if (res.ok) {
          const data = await res.json();
          // Filtrar cartas con precio, stock > 0, y ordenar por precio (las más caras primero)
          const sorted = data
            .filter(c => c.price > 0 && c.stock > 0 && (c.image || c.imageUrl))
            .sort((a, b) => b.price - a.price)
            .slice(0, 10); // Solo las 10 más caras
          setCards(sorted);
        }
      } catch (e) {
        console.error('Error loading cards:', e);
      }
    }
    fetchCards();
  }, []);

  // Rotar cartas cada 5 segundos
  useEffect(() => {
    if (cards.length <= 1) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % cards.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [cards.length]);

  const currentCard = cards[currentIndex] || null;

  // Si no hay cartas cargadas, no mostrar nada significativo
  if (!currentCard) {
    return (
      <section style={styles.hero}>
        <div style={styles.gridLines} />
        <div style={styles.orbRed} />
        <div style={styles.orbYellow} />
        <div style={styles.content}>
          <p style={styles.eyebrow}>⚡ La tienda #1 de TCG en LATAM</p>
          <h1 style={styles.title}>
            COLECCIONA.<br />
            <span style={styles.titleYellow}>BATALLA.</span><br />
            DOMINA.
          </h1>
          <p style={styles.subtitle}>
            Las cartas más raras del mundo Pokémon en un solo lugar.
            Autenticidad garantizada. Envío a todo el país.
          </p>
          <div style={styles.btnContainer}>
            <div style={styles.btnGroup}>
              <button style={styles.btnPrimary} onClick={() => document.getElementById('cartas')?.scrollIntoView({ behavior: 'smooth' })}>Ver Colección</button>
            </div>
            <a href="/compramos-tu-carta" style={styles.btnBuy}>
              Compramos tu carta
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Obtener URL de imagen (puede ser image o imageUrl)
  const cardImage = currentCard.image || currentCard.imageUrl;

  const getSetName = (set) => {
    if (!set) return 'Unknown';
    if (typeof set === 'string') return set;
    if (typeof set === 'object' && set.name) return set.name;
    return 'Unknown';
  };

  return (
    <section style={styles.hero}>
      {/* Background grid lines */}
      <div style={styles.gridLines} />

      {/* Glow orbs */}
      <div style={styles.orbRed} />
      <div style={styles.orbYellow} />

      <div style={styles.content}>
        <p style={styles.eyebrow}>⚡ La tienda #1 de TCG en LATAM</p>
        <h1 style={styles.title}>
          COLECCIONA.<br />
          <span style={styles.titleYellow}>BATALLA.</span><br />
          DOMINA.
        </h1>
        <p style={styles.subtitle}>
          Las cartas más raras del mundo Pokémon en un solo lugar.
          Autenticidad garantizada. Envío a todo el país.
        </p>
        <div style={{ ...styles.btnContainer, alignItems: 'center' }}>
          <button style={styles.btnPrimary} onClick={() => document.getElementById('cartas')?.scrollIntoView({ behavior: 'smooth' })}>Ver Colección</button>
          <a href="/compramos-tu-carta" style={{ ...styles.btnBuy, width: '100%', marginTop: 8 }}>
            Compramos tu carta
          </a>
        </div>

        <div style={styles.stats}>
          {[
            { num: '12K+', label: 'Cartas disponibles' },
            { num: '4.9★', label: 'Calificación' },
            { num: '3K+', label: 'Clientes felices' },
          ].map(s => (
            <div key={s.label} style={styles.stat}>
              <span style={styles.statNum}>{s.num}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative card stack */}
      <div style={styles.cardStack}>
        <div style={{ ...styles.fakeCard, ...styles.cardBack2 }} />
        <div style={{ ...styles.fakeCard, ...styles.cardBack1 }} />
        {cardImage ? (
          <img 
            src={cardImage} 
            alt={currentCard.name}
            style={{
              ...styles.cardImageOnly,
              opacity: isTransitioning ? 0 : 1,
              transition: 'opacity 0.3s ease'
            }}
            onError={(e) => e.target.style.display = 'none'}
          />
        ) : (
          <div style={{ 
            ...styles.fakeCard, 
            ...styles.cardFront,
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            <div style={styles.cardInnerNoImage}>
              <div style={styles.cardBadge}>{currentCard.rarity || 'RARE'} ✦</div>
              <div style={styles.cardName}>{currentCard.name}</div>
              <div style={styles.cardSet}>{getSetName(currentCard.set)}</div>
              <div style={styles.cardPrice}>${currentCard.price?.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Dots removed as requested */}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-16px) rotate(-6deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-content > * {
          animation: fadeUp 0.7s ease forwards;
        }
        button:hover { opacity: 0.85; transform: translateY(-2px); transition: all 0.2s; }

        /* Responsive styles */
        @media (max-width: 1024px) {
          section { padding: 100px 40px 60px !important; }
        }

        @media (max-width: 768px) {
          section { 
            flex-direction: column !important; 
            padding: 80px 24px 40px !important;
            min-height: auto !important;
            gap: 30px !important;
          }
          section > div:nth-child(4) { 
            max-width: 100% !important; 
            text-align: center !important;
          }
          section > div:nth-child(4) h1 { 
            font-size: 48px !important; 
          }
          section > div:nth-child(4) p:last-of-type { 
            max-width: 100% !important; 
          }
          section > div:nth-child(4) > div:last-child { 
            justify-content: center !important; 
          }
          section > div:nth-child(5) {
            width: 200px !important;
            height: 340px !important;
            margin: 0 auto !important;
          }
          section > div:nth-child(5) > div:nth-child(1),
          section > div:nth-child(5) > div:nth-child(2) {
            width: 180px !important;
            height: 260px !important;
          }
          section > div:nth-child(5) > img,
          section > div:nth-child(5) > div:nth-child(3) {
            width: 180px !important;
            height: 260px !important;
          }
        }

        @media (max-width: 480px) {
          section { 
            padding: 70px 16px 30px !important;
          }
          section > div:nth-child(4) h1 { 
            font-size: 36px !important; 
          }
          section > div:nth-child(4) p:first-of-type { 
            font-size: 11px !important; 
          }
          section > div:nth-child(4) p:last-of-type { 
            font-size: 14px !important; 
          }
          section > div:nth-child(4) > div:first-of-type button {
            padding: 12px 20px !important;
            font-size: 13px !important;
          }
          section > div:nth-child(4) > div:last-child {
            gap: 20px !important;
          }
          section > div:nth-child(4) > div:last-child > div span:first-child {
            font-size: 28px !important;
          }
          section > div:nth-child(5) {
            width: 160px !important;
            height: 280px !important;
          }
          section > div:nth-child(5) > div:nth-child(1),
          section > div:nth-child(5) > div:nth-child(2) {
            width: 140px !important;
            height: 200px !important;
          }
          section > div:nth-child(5) > img,
          section > div:nth-child(5) > div:nth-child(3) {
            width: 140px !important;
            height: 200px !important;
          }
        }
      `}</style>
    </section>
  );
}

const styles = {
  hero: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '120px 80px 80px',
    overflow: 'hidden',
    gap: '40px',
  },
  gridLines: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    pointerEvents: 'none',
  },
  orbRed: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(227,0,44,0.15) 0%, transparent 70%)',
    top: '-100px',
    right: '0',
    pointerEvents: 'none',
  },
  orbYellow: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
    bottom: '0',
    left: '300px',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '600px',
  },
  eyebrow: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: 'var(--accent-purple)',
    marginBottom: '20px',
  },
  title: {
    fontSize: 'clamp(52px, 7vw, 96px)',
    lineHeight: '0.95',
    color: 'var(--accent-blue)',
    marginBottom: '28px',
    fontFamily: "'Bebas Neue', sans-serif",
  },
  titleYellow: {
    color: 'var(--accent-purple)',
    textShadow: '0 0 40px rgba(124,58,237,0.18)',
  },
  subtitle: {
    fontSize: '17px',
    color: 'var(--muted)',
    lineHeight: '1.7',
    marginBottom: '40px',
    maxWidth: '460px',
    fontWeight: '500',
  },
  btnContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '60px',
    maxWidth: '380px',
  },
  btnGroup: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: '#ffffff',
    border: '2px solid transparent',
    padding: '12px 34px',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    borderRadius: '8px',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
    cursor: 'pointer',
  },
  btnSecondary: {
    background: 'transparent',
    color: 'var(--accent-purple)',
    border: '2px solid rgba(124,58,237,0.18)',
    padding: '14px 36px',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  btnBuy: {
    display: 'block',
    background: 'transparent',
    color: 'var(--accent-purple)',
    border: '2px solid rgba(124,58,237,0.18)',
    padding: '14px 36px',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    borderRadius: '8px',
    transition: 'all 0.2s',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    width: '100%',
  },
  stats: {
    display: 'flex',
    gap: '40px',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
  },
  statNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '36px',
    color: 'var(--accent-purple)',
    letterSpacing: '2px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#7a7a9a',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  // Card stack
  cardStack: {
    position: 'relative',
    width: '280px',
    height: '500px',
    flexShrink: 0,
    zIndex: 2,
  },
  fakeCard: {
    position: 'absolute',
    width: '260px',
    height: '370px',
    borderRadius: '16px',
    border: '1px solid rgba(124,58,237,0.12)',
  },
  cardBack2: {
    background: 'linear-gradient(145deg, #2d1b4e 0%, #1a1035 50%, #0d0a1a 100%)',
    transform: 'rotate(-12deg)',
    top: '30px',
    left: '30px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    opacity: 0.6,
  },
  cardBack1: {
    background: 'linear-gradient(145deg, #3d2470 0%, #251550 50%, #150d30 100%)',
    transform: 'rotate(-9deg)',
    top: '15px',
    left: '15px',
    boxShadow: '0 25px 70px rgba(0,0,0,0.4)',
    opacity: 0.8,
  },
  cardFront: {
    background: 'linear-gradient(135deg, #1a1a30 0%, #0f1a2a 50%, #1a0a10 100%)',
    transform: 'rotate(-6deg)',
    top: 0,
    left: 0,
    animation: 'float 4s ease-in-out infinite',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    overflow: 'hidden',
  },
  cardImageOnly: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '260px',
    height: '370px',
    objectFit: 'contain',
    borderRadius: '12px',
    transform: 'rotate(-6deg)',
    animation: 'float 4s ease-in-out infinite',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.12)',
  },
  cardInner: {
    width: '100%',
  },
  cardInnerNoImage: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '100%',
    padding: '12px',
  },
  cardBadge: {
    fontSize: '10px',
    letterSpacing: '2px',
    color: 'var(--accent-purple)',
    fontWeight: '700',
    marginBottom: '8px',
  },
  cardName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '36px',
    color: 'var(--accent-blue)',
    letterSpacing: '2px',
  },
  cardSet: {
    fontSize: '12px',
    color: '#7a7a9a',
    fontWeight: '600',
    marginBottom: '12px',
  },
  cardPrice: {
    fontSize: '22px',
    fontFamily: "'Bebas Neue', sans-serif",
    color: '#E3002C',
    letterSpacing: '1px',
  },
  cardInfo: {
    position: 'absolute',
    top: '390px',
    left: '0',
    width: '260px',
    textAlign: 'center',
    transform: 'rotate(-6deg)',
  },
  cardBadgeSmall: {
    fontSize: '9px',
    letterSpacing: '2px',
    color: 'var(--accent-purple)',
    fontWeight: '700',
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
  cardNameSmall: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '28px',
    color: 'var(--accent-blue)',
    letterSpacing: '2px',
  },
  cardSetSmall: {
    fontSize: '11px',
    color: '#7a7a9a',
    fontWeight: '600',
    marginBottom: '6px',
  },
  cardPriceSmall: {
    fontSize: '20px',
    fontFamily: "'Bebas Neue', sans-serif",
    color: '#E3002C',
    letterSpacing: '1px',
  },
  cardDots: {
    position: 'absolute',
    bottom: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
};
