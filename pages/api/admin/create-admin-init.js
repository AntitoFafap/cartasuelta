const auth = require('../../../lib/auth.js');

export default async function handler(req, res) {
  // Solo permite POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Se requiere username y password' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username debe tener al menos 3 caracteres' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar que el usuario no existe
    const existingAdmin = await auth.getAdminByUsername(username);
    if (existingAdmin) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Crear nuevo admin en DynamoDB
    const newAdmin = await auth.createAdmin(
      username,
      password,
      'superadmin',
      email || `${username}@pokemon.local`
    );

    if (!newAdmin) {
      return res.status(500).json({ error: 'Error creando admin en DynamoDB' });
    }

    return res.status(200).json({
      message: 'Admin creado exitosamente',
      admin: {
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        isActive: newAdmin.isActive,
      },
    });
  } catch (error) {
    console.error('Error en create-admin-init:', error);
    return res.status(500).json({
      error: 'Error creando admin',
      message: error.message,
    });
  }
}
