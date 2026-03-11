import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: registro, 2: confirmar email, 3: éxito
  const router = useRouter();
  const { register, confirmEmail } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email y contraseña son requeridos');
      return false;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('La contraseña debe incluir al menos una mayúscula');
      return false;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('La contraseña debe incluir al menos una minúscula');
      return false;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('La contraseña debe incluir al menos un número');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );

      // Registro exitoso - ir directamente al login
      setStep(3);
      // Eliminar redirección automática para permitir usar la flecha atrás
    } catch (err) {
      setError(err.message || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmEmail(e) {
    e.preventDefault();
    setError('');

    if (!confirmationCode) {
      setError('Ingresa el código de confirmación');
      return;
    }

    setLoading(true);

    try {
      await confirmEmail(formData.email, confirmationCode);
      setStep(3); // éxito
      // Eliminar redirección automática para permitir usar la flecha atrás
    } catch (err) {
      setError(err.message || 'Error al confirmar el email');
    } finally {
      setLoading(false);
    }
  }

  if (step === 3) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successBox}>
            <h2 style={styles.successTitle}>¡Registro Exitoso!</h2>
            <p style={styles.successText}>
              Tu cuenta ha sido creada y verificada.
            </p>
            <p style={styles.successText}>
              Redirigiendo al login en 2 segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button
        onClick={() => router.replace('/')}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 44,
          height: 44,
          background: 'linear-gradient(135deg, #f87171 0%, #fbbf24 100%)',
          border: '2px solid #fff',
          borderRadius: '50%',
          fontSize: 28,
          color: '#fff',
          fontWeight: 'bold',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'scale(1.12)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(248,113,113,0.25)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
        }}
        aria-label="Cerrar"
      >
        ×
      </button>
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
        {step === 1 && (
          <>
            <h1 style={styles.title}>Crear Cuenta</h1>
            <p style={styles.subtitle}>Regístrate para comenzar a comprar</p>

            {error && (
              <div style={styles.errorBox}>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} style={styles.form}>
              <div style={styles.row}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label htmlFor="firstName" style={styles.label}>Nombre</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Juan"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label htmlFor="lastName" style={styles.label}>Apellido</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Pérez"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="email" style={styles.label}>Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="password" style={styles.label}>Contraseña</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>

            <div style={styles.links}>
              <p>
                ¿Ya tienes cuenta? <Link href="/auth/login">Inicia sesión aquí</Link>
              </p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={styles.title}>Verificar Email</h1>
            <p style={styles.subtitle}>
              Hemos enviado un código de confirmación a {formData.email}
            </p>

            {error && (
              <div style={styles.errorBox}>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleConfirmEmail} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="code" style={styles.label}>Código de Confirmación</label>
                <input
                  id="code"
                  type="text"
                  placeholder="123456"
                  maxLength="6"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  required
                  disabled={loading}
                  style={styles.input}
                />
                <small style={styles.hint}>
                  Revisa tu email y copia el código de 6 dígitos
                </small>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={styles.button}
              >
                {loading ? 'Verificando...' : 'Confirmar Email'}
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

            <div style={styles.hint}>
              <p>¿No recibiste el código? Revisa tu carpeta de spam</p>
            </div>
          </>
        )}
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
    margin: '8px 0',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  row: {
    display: 'flex',
    gap: '12px',
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
