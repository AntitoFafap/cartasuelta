import { useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const { getTotalItems, setIsOpen } = useCart();
  const { isAuthenticated, loading, logout, isAdmin } = useAuth();
  const { setSearchTerm } = useSearch();
  const router = useRouter();
  const cartCount = getTotalItems();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && localSearch.trim()) {
      setSearchTerm(localSearch.trim());
      // Navegar a la sección de cartas
      if (router.pathname !== '/') {
        router.push('/#cartas');
      } else {
        document.getElementById('cartas')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      router.push('/');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <>
      <nav style={styles.nav}>
          <div style={styles.logo}>
          <img src="/logo.png" alt="Logo" style={{ height: 50, maxWidth: 'auto', display: 'block' }} />
        </div>

        <div style={styles.searchWrap}>
          <div style={styles.searchIcon} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar cartas o sets..."
            aria-label="Buscar"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleSearch}
            style={styles.searchInputNav}
          />
        </div>

        <ul style={{ ...styles.links, ...(menuOpen ? styles.linksOpen : {}) }}>
        </ul>

        <div style={styles.actions} className="nav-actions">
          <button 
            style={styles.iconBtn}
            onClick={() => setIsOpen(true)}
            title="Carrito"
            aria-label="Abrir carrito"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </button>
          {cartCount > 0 && (
            <button style={styles.cartBadge}>{cartCount}</button>
          )}
          
          {!loading && !isAuthenticated ? (
            <>
              <a href="/auth/login" style={styles.loginBtn}>
                Ingresar
              </a>
              <a href="/auth/register" style={styles.registerBtn}>
                Registrarse
              </a>
            </>
          ) : !loading && isAuthenticated ? (
            <div style={styles.userMenuContainer}>
              <button 
                style={styles.userBtn}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </button>
              {userMenuOpen && (
                <div style={styles.userMenu}>
                  <a 
                    href="/profile"
                    style={styles.userMenuItem}
                  >
                    Mi Perfil
                  </a>
                  <a 
                    href="/orders"
                    style={styles.userMenuItem}
                  >
                    Mis Pedidos
                  </a>
                  <button 
                    style={styles.userMenuItemLogout}
                    onClick={handleLogout}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {isAdmin && (
            <a href="/admin" style={styles.adminBtn} title="Panel Admin">
              Admin
            </a>
          )}
        </div>

        <button style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          <span />
          <span />
          <span />
        </button>
      </nav>

      <style jsx global>{`
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        nav { animation: navSlideDown 0.5s ease forwards; }

        nav a:hover { color: var(--accent-purple) !important; }

        @media (max-width: 1024px) {
          nav { padding: 0 24px !important; height: 70px !important; }
          nav > div:first-child img { height: 35px !important; }
        }

        @media (max-width: 768px) {
          nav { padding: 0 16px !important; height: 60px !important; gap: 8px !important; }
          nav > div:first-child img { height: 30px !important; }
          .nav-links { display: none; }
          .nav-links.open { display: flex !important; flex-direction: column; position: absolute; top: 60px; left: 0; right: 0; background: white; padding: 20px; gap: 16px; border-bottom: 1px solid var(--border); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        }

        @media (max-width: 480px) {
          nav > div:nth-child(2) { flex: 1 !important; margin-left: 8px !important; }
          nav > div:nth-child(2) input { padding: 10px 12px 10px 36px !important; font-size: 13px !important; }
          .nav-actions { gap: 6px !important; }
          .nav-actions a[href="/auth/register"] { display: none !important; }
          .nav-actions a[href="/auth/login"] { padding: 6px 10px !important; font-size: 11px !important; }
          .nav-actions a[href="/admin"] { 
            padding: 5px 8px !important; 
            font-size: 10px !important; 
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
            color: white !important;
            border-radius: 4px !important;
          }
          .nav-actions button { padding: 6px !important; }
          .nav-actions button svg { width: 18px !important; height: 18px !important; }
        }
      `}</style>
    </>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 48px',
    height: '100px',
    background: 'rgba(255, 255, 255, 0.98)',
    borderBottom: '1px solid var(--border)',
    boxShadow: '0 6px 20px rgba(2,6,23,0.06)',
    backdropFilter: 'blur(6px)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    fontSize: '22px',
    fontFamily: "'Bebas Neue', sans-serif",
    letterSpacing: '1px',
    userSelect: 'none',
    color: 'var(--text)',
  },
  searchWrap: {
    flex: '0 1 800px',
    display: 'flex',
    alignItems: 'center',
    marginLeft: '24px',
    position: 'relative',
  },
  searchInputNav: {
    width: '100%',
    maxWidth: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '14px 18px 14px 48px',
    borderRadius: '14px',
    fontSize: '15px',
    color: 'var(--text)',
    outline: 'none',
    boxShadow: 'none',
    fontWeight: '500',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--accent-blue)',
    pointerEvents: 'none',
  },
  logoRed: { color: 'var(--accent-purple)' },
  logoYellow: { color: 'var(--yellow)' },
  links: {
    display: 'flex',
    gap: '32px',
    listStyle: 'none',
    marginLeft: 'auto',
  },
  linksOpen: {},
  link: {
    fontSize: '15px',
    fontWeight: '600',
    letterSpacing: '1.5px',
    color: 'var(--text)',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    position: 'relative',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent-blue)',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s, background 0.2s',
  },
  cartBadge: {
    position: 'absolute',
    top: '-4px',
    right: '90px',
    background: 'var(--red)',
    color: 'var(--accent-blue)',
    fontSize: '10px',
    fontWeight: '700',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
  },
  loginBtn: {
    background: 'transparent',
    border: '1px solid rgba(15,23,36,0.08)',
    color: 'var(--text)',
    padding: '6px 18px',
    borderRadius: '6px',
    fontWeight: '700',
    letterSpacing: '1px',
    fontSize: '13px',
    textTransform: 'uppercase',
    transition: 'background 0.2s, color 0.2s',
  },
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    gap: '5px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
  },
  userMenuContainer: {
    position: 'relative',
  },
  userBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent-blue)',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'color 0.2s, background 0.2s',
  },
  userMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
    marginTop: '8px',
    minWidth: '200px',
    zIndex: 1000,
  },
  userMenuItem: {
    display: 'block',
    padding: '12px 16px',
    color: 'var(--text)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  },
  userMenuItemLogout: {
    width: '100%',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    color: 'var(--red)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s',
  },
  registerBtn: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '6px 18px',
    borderRadius: '6px',
    fontWeight: '700',
    letterSpacing: '1px',
    fontSize: '13px',
    textTransform: 'uppercase',
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: 'inline-block',
  },
  adminBtn: {
    background: 'transparent',
    border: '1px solid rgba(15,23,36,0.08)',
    color: 'var(--text)',
    padding: '6px 18px',
    borderRadius: '6px',
    fontWeight: '700',
    letterSpacing: '1px',
    fontSize: '13px',
    textTransform: 'uppercase',
    transition: 'background 0.2s, color 0.2s',
    textDecoration: 'none',
    display: 'inline-block',
  },
};
