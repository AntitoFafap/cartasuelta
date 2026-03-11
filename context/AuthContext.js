import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState(null);

  // Verificar si hay usuario autenticado al montar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        setIsAdmin(data.user?.isAdmin || false);
        setAdminRole(data.user?.adminRole || null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setAdminRole(null);
      }
    } catch (err) {
      console.log('No hay usuario autenticado');
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setAdminRole(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, firstName = '', lastName = '') => {
    setError(null);
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
      }

      return { 
        userId: data.userId, 
        verificationCode: data.verificationCode,
        message: data.message 
      };
    } catch (err) {
      const errorMessage = err.message || 'Error en el registro';
      setError(errorMessage);
      throw err;
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el login');
      }

      setUser(data.user);
      setIsAuthenticated(true);
      setIsAdmin(data.user?.isAdmin || false);
      setAdminRole(data.user?.adminRole || null);

      return data;
    } catch (err) {
      const errorMessage = err.message || 'Error en el login';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await fetch('/api/users/logout', { method: 'POST' });
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setAdminRole(null);
      // Limpiar carrito al cerrar sesión
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
        // Disparar evento para que CartContext limpie su estado
        window.dispatchEvent(new Event('clearCart'));
      }
    } catch (err) {
      const errorMessage = err.message || 'Error al cerrar sesión';
      setError(errorMessage);
      throw err;
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al solicitar reset de contraseña');
      }

      return data;
    } catch (err) {
      const errorMessage = err.message || 'Error al solicitar reset de contraseña';
      setError(errorMessage);
      throw err;
    }
  };

  const confirmPassword = async (email, code, newPassword) => {
    setError(null);
    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al confirmar reset de contraseña');
      }

      return true;
    } catch (err) {
      const errorMessage = err.message || 'Error al confirmar reset de contraseña';
      setError(errorMessage);
      throw err;
    }
  };

  const confirmEmail = async (email, code) => {
    setError(null);
    try {
      const response = await fetch('/api/users/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al confirmar el email');
      }

      return true;
    } catch (err) {
      const errorMessage = err.message || 'Error al confirmar el email';
      setError(errorMessage);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    adminRole,
    register,
    login,
    logout,
    forgotPassword,
    confirmPassword,
    confirmEmail,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
