export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.top}>
        <div style={styles.brand}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="Logo" style={{ height: 56 }} />
            <div style={{ fontSize: '20px', fontWeight: 800 }}>Carta Suelta</div>
          </div>
          <p style={styles.tagline}>
            Tu tienda de confianza para cartas Pokémon TCG.<br />
            Autenticidad garantizada en cada compra.
          </p>
          <div style={styles.social}>
            {['Instagram', 'TikTok', 'WhatsApp'].map(s => (
              <a key={s} href="#" style={styles.socialLink}>{s}</a>
            ))}
          </div>
        </div>

        <div style={styles.links}>
          <div style={styles.linkCol}>
            <h4 style={styles.colTitle}>Tienda</h4>
            {['Cartas Singulares', 'Colecciones'].map(l => (
              <a key={l} href="#" style={styles.link}>{l}</a>
            ))}
          </div>
          <div style={styles.linkCol}>
            <h4 style={styles.colTitle}>Contacto</h4>
            <p style={styles.contactInfo}>📧 hola@cartasuelta.cl</p>
            <p style={styles.contactInfo}>📱 +56 9 XXXX XXXX</p>
            <p style={styles.contactInfo}>🕐 Lun–Vie 9:00–19:00</p>
          </div>
        </div>
      </div>

      <div style={styles.bottom}>
        <p style={styles.copy}>© 2025 Carta Suelta. Todos los derechos reservados.</p>
        <p style={styles.disclaimer}>
          Pokémon y sus marcas son propiedad de Nintendo / The Pokémon Company.
        </p>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: 'var(--bg)',
    borderTop: '1px solid var(--border)',
    padding: '60px 80px 30px',
  },
  top: {
    display: 'flex',
    gap: '80px',
    marginBottom: '60px',
    flexWrap: 'wrap',
  },
  brand: {
    maxWidth: '320px',
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '28px',
    letterSpacing: '1px',
    marginBottom: '8px',
    color: 'var(--text)',
  },
  tagline: {
    fontSize: '14px',
    color: 'var(--muted)',
    lineHeight: '1.7',
    marginBottom: '18px',
    fontWeight: '500',
  },
  social: {
    display: 'flex',
    gap: '16px',
  },
  socialLink: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--muted)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
  },
  links: {
    display: 'flex',
    gap: '60px',
    flexWrap: 'wrap',
    flex: 1,
  },
  linkCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  colTitle: {
    fontSize: '14px',
    fontFamily: "'Bebas Neue', sans-serif",
    letterSpacing: '1px',
    color: 'var(--accent-purple)',
    marginBottom: '4px',
  },
  link: {
    fontSize: '14px',
    color: 'var(--text)',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  contactInfo: {
    fontSize: '13px',
    color: 'var(--muted)',
    fontWeight: '500',
  },
  bottom: {
    borderTop: '1px solid rgba(15,23,36,0.05)',
    paddingTop: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  },
  copy: {
    fontSize: '13px',
    color: 'var(--muted)',
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: '12px',
    color: 'var(--muted)',
  },
};
