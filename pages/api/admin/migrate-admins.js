const fs = require('fs');
const path = require('path');
const { hashPassword } = require('../../../lib/security.js');

export default async function handler(req, res) {
  try {
    // Solo permite GET para ver estado o POST para migrar
    if (req.method === 'GET') {
      return res.status(200).json({ 
        message: 'Status de migración',
        info: 'Usa POST para migrar el admin lecheconplatano a Amplify'
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Cargar amplify_outputs para obtener la configuración de GraphQL
    const outputsPath = path.join(process.cwd(), 'amplify_outputs.json');
    const amplifyConfig = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Obtener contraseña del body o usar una default
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ 
        error: 'Se requiere parámetro "password" en el body'
      });
    }

    const passwordHash = hashPassword(password);

    // Mutation para crear el admin
    const mutation = `
      mutation CreateAdmin($input: CreateAdminInput!) {
        createAdmin(input: $input) {
          id
          username
          email
          role
          isActive
          createdAt
        }
      }
    `;

    const response = await fetch(amplifyConfig.data.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': amplifyConfig.data.api_key,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            username: 'lecheconplatano',
            email: 'admin@pokemon.local',
            passwordHash: passwordHash,
            fullName: 'Administrador Principal',
            role: 'superadmin',
            isActive: true,
          },
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL error:', data.errors);
      return res.status(500).json({ 
        error: 'Error creando admin en Amplify',
        details: data.errors 
      });
    }

    return res.status(200).json({ 
      message: 'Admin lecheconplatano creado exitosamente en Amplify',
      admin: data.data?.createAdmin || {}
    });
  } catch (error) {
    console.error('Error en migrate-admins:', error);
    return res.status(500).json({ 
      error: 'Error en la migración',
      message: error.message 
    });
  }
}
