import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Este componente ahora redirige al login unificado
export default function AdminLogin() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Rajdhani', sans-serif",
    }}>
      <p style={{ color: 'white', fontSize: '18px' }}>Redirigiendo al login...</p>
    </div>
  );
}
