
export default async function handler(req, res) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener token de la cookie
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/userToken=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Buscar sesión
    // Aquí deberías buscar la sesión en la tabla UserSession de MySQL si la tienes
    
    if (!session) {
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    // Verificar si expiró (expiresAt está en segundos)
    const nowSeconds = Math.floor(Date.now() / 1000);
    // Si tienes lógica de expiración de sesión, implementa aquí

    // Obtener datos del usuario
    // Aquí deberías buscar el usuario por ID en MySQL si tienes la sesión
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }

    // Verificar si el usuario es también admin
    let isAdmin = false;
    let adminRole = null;
    
    // Puedes buscar el admin por email en la tabla Admin

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        city: user.city,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        isAdmin,
        adminRole,
      },
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return res.status(500).json({ error: 'Error obteniendo usuario' });
  }
}
