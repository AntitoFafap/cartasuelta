import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Error en el login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <style>{`
        input:focus {
          outline: none;
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1) !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px rgba(124, 58, 237, 0.3);
        }
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        a {
          color: #7c3aed;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      `}</style>

      {/* Botón de cerrar en la esquina superior derecha absoluta */}
      <div style={{
        position: 'fixed',
        top: 32,
        right: 32,
        zIndex: 1000,
      }}>
        <button
          onClick={() => router.replace('/')}
          style={{
            width: 44,
            height: 44,
            background: 'linear-gradient(135deg, #f87171 0%, #fbbf24 100%)',
            border: '2px solid #fff',
            borderRadius: '50%',
            fontSize: 28,
            color: '#fff',
            fontWeight: 'bold',
            boxShadow: '0 8px 32px rgba(248,113,113,0.18)',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'scale(1.12)';
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(248,113,113,0.25)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(248,113,113,0.18)';
          }}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
      <div style={styles.card}>
        <h1 style={styles.title}>Inicia Sesión</h1>
        <p style={styles.subtitle}>Accede a tu cuenta</p>

        {error && (
          <div style={styles.errorBox}>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={styles.links}>
          <p>
            ¿No tienes cuenta? <Link href="/auth/register">Regístrate aquí</Link>
          </p>
          <p>
            ¿Olvidaste tu contraseña? <Link href="/auth/forgot-password">Recuperarla</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    margin: '0 0 10px',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    margin: '0 0 30px',
    fontSize: '14px',
    color: '#6b7280',
  },
  errorBox: {
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
    color: '#991b1b',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
  },
  button: {
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '8px',
  },
  links: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '20px',
  },
};
