import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CompramosTuCarta() {
  const router = useRouter();
  const whatsappNumber = '+569888881';
  const whatsappMessage = encodeURIComponent('¡Hola! Me gustaría vender mis cartas Pokémon. 🎴');
  const whatsappLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${whatsappMessage}`;

  return (
    <>
      <Head>
        <title>Compramos tu Carta | Pokemon TCG Store</title>
        <meta name="description" content="¿Tienes cartas Pokémon que quieres vender? ¡Nosotros las compramos! Contáctanos por WhatsApp." />
      </Head>

      <div style={styles.container}>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .whatsapp-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 20px 40px rgba(37, 211, 102, 0.4) !important;
          }
          .back-btn:hover {
            background: rgba(124, 58, 237, 0.1) !important;
          }
        `}</style>

        <button 
          onClick={() => router.push('/')} 
          style={styles.backBtn}
          className="back-btn"
        >
          ← Volver al inicio
        </button>

        <div style={styles.card}>
          <div style={styles.iconContainer}>
            <span style={styles.icon}>💰</span>
          </div>
          
          <h1 style={styles.title}>¡Compramos tus Cartas!</h1>
          
          <p style={styles.subtitle}>
            ¿Tienes cartas Pokémon que ya no usas o quieres vender? 
            <br />
            <strong>¡Nosotros te las compramos!</strong>
          </p>

          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>✅</span>
              <span>Pago justo y competitivo</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>⚡</span>
              <span>Respuesta rápida</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🔒</span>
              <span>Transacción segura</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>📦</span>
              <span>Compramos colecciones completas</span>
            </div>
          </div>

          <div style={styles.instructions}>
            <h2 style={styles.instructionsTitle}>¿Cómo funciona?</h2>
            <ol style={styles.stepsList}>
              <li style={styles.step}>
                <span style={styles.stepNumber}>1</span>
                <span>Escríbenos por WhatsApp con fotos de tus cartas</span>
              </li>
              <li style={styles.step}>
                <span style={styles.stepNumber}>2</span>
                <span>Te damos una cotización en menos de 24 horas</span>
              </li>
              <li style={styles.step}>
                <span style={styles.stepNumber}>3</span>
                <span>Si aceptas, coordinamos el envío y pago</span>
              </li>
            </ol>
          </div>

          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.whatsappBtn}
            className="whatsapp-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Escríbenos por WhatsApp
          </a>

          <p style={styles.phoneNumber}>
            O llámanos directamente: <strong>{whatsappNumber}</strong>
          </p>
        </div>

        <div style={styles.tips}>
          <h3 style={styles.tipsTitle}>💡 Tips para una mejor cotización</h3>
          <ul style={styles.tipsList}>
            <li>Envía fotos claras del frente y reverso de cada carta</li>
            <li>Menciona si las cartas están en fundas protectoras</li>
            <li>Indícanos el estado de las cartas (mint, near mint, played, etc.)</li>
            <li>Si tienes muchas cartas, envía un listado o fotos del lote completo</li>
          </ul>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
    padding: '40px 20px',
    fontFamily: "'Rajdhani', sans-serif",
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: '2px solid rgba(124, 58, 237, 0.2)',
    color: '#7c3aed',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '24px',
    transition: 'all 0.2s',
    fontFamily: "'Rajdhani', sans-serif",
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '20px',
    padding: '48px 40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '24px',
  },
  icon: {
    fontSize: '64px',
    animation: 'float 3s ease-in-out infinite',
    display: 'inline-block',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#0f1724',
    marginBottom: '16px',
    letterSpacing: '1px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '32px',
    textAlign: 'left',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#f9fafb',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  featureIcon: {
    fontSize: '18px',
  },
  instructions: {
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '32px',
    textAlign: 'left',
  },
  instructionsTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f1724',
    marginBottom: '16px',
    textAlign: 'center',
  },
  stepsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    color: '#374151',
  },
  stepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
    flexShrink: 0,
  },
  whatsappBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    background: '#25D366',
    color: 'white',
    padding: '16px 40px',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    textDecoration: 'none',
    boxShadow: '0 10px 30px rgba(37, 211, 102, 0.3)',
    transition: 'all 0.3s ease',
    animation: 'pulse 2s infinite',
  },
  phoneNumber: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#6b7280',
  },
  tips: {
    maxWidth: '600px',
    margin: '32px auto 0',
    background: 'white',
    borderRadius: '16px',
    padding: '24px 32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  },
  tipsTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f1724',
    marginBottom: '16px',
  },
  tipsList: {
    margin: 0,
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.6',
  },
};
