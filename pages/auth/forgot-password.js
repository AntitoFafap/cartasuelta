import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: solicitar email, 2: confirmar code
  const { forgotPassword, confirmPassword: confirmPasswordFunc } = useAuth();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Error solicitando reset de contraseña');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos una mayúscula');
      return false;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos una minúscula');
      return false;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos un número');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordFunc(email, code, newPassword);
      setStep(3); // success
    } catch (err) {
      setError(err.message || 'Error confirmando reset de contraseña');
    } finally {
      setLoading(false);
    }
  };

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

      <div style={styles.card}>
        <h1 style={styles.title}>Recuperar Contraseña</h1>

        {step === 3 && (
          <>
            <div style={styles.successBox}>
              <h2 style={styles.successTitle}>¡Contraseña Actualizada!</h2>
              <p style={styles.successText}>
                Tu contraseña ha sido actualizada correctamente.
              </p>
              <button 
                onClick={() => window.location.href = '/auth/login'}
                style={styles.button}
              >
                Ir al login
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p style={styles.subtitle}>Ingresa tu email para recibir un código de recuperación</p>

            {error && (
              <div style={styles.errorBox}>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleRequestReset} style={styles.form}>
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

              <button
                type="submit"
                disabled={loading}
                style={styles.button}
              >
                {loading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p style={styles.subtitle}>Ingresa el código enviado a tu email y tu nueva contraseña</p>

            {error && (
              <div style={styles.errorBox}>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleConfirmReset} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="code" style={styles.label}>Código de Verificación</label>
                <input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={loading}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="newPassword" style={styles.label}>Nueva Contraseña</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={styles.input}
                />
                <small style={styles.hint}>
                  Mínimo 8 caracteres, con mayúscula, minúscula y número
                </small>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="confirmPassword" style={styles.label}>Confirmar Contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                style={{ ...styles.button, background: '#d1d5db', color: '#374151' }}
              >
                Volver
              </button>
            </form>
          </>
        )}

        <div style={styles.links}>
          <p>
            Recuerda tu contraseña? <Link href="/auth/login">Inicia sesión aquí</Link>
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
    maxWidth: '450px',
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
  successBox: {
    background: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    color: '#166534',
  },
  successTitle: {
    margin: '0 0 16px',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  successText: {
    margin: '8px 0 20px',
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
  hint: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
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
