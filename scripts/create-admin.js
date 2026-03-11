const fs = require('fs');
const path = require('path');
const { hashPassword } = require('../lib/security.js');

async function createAdminUser() {
  try {
    const username = 'completoxl';
    const password = 'salchipapa';
    const email = 'antonian.dev@gmail.com';
    const db = require('../lib/db').default || require('../lib/db');
    const passwordHash = hashPassword(password);
    const now = Math.floor(Date.now() / 1000);
    const [result] = await db.query(
      'INSERT INTO admins (username, email, passwordHash, role, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, 'superadmin', true, now]
    );
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [result.insertId]);
    const createdAdmin = rows[0];
    if (createdAdmin) {
      console.log('Admin creado exitosamente!');
      console.log('Datos del nuevo admin:');
      console.log(`   ID: ${createdAdmin.id}`);
      console.log(`   Username: ${createdAdmin.username}`);
      console.log(`   Email: ${createdAdmin.email}`);
      console.log(`   Role: ${createdAdmin.role}`);
      console.log(`   Activo: ${createdAdmin.isActive}`);
      console.log(`   Creado: ${createdAdmin.createdAt}`);
      console.log('\nAhora puedes hacer login con:');
      console.log(`   Usuario: ${username}`);
      console.log(`   Contraseña: ${password}`);
    } else {
      console.error('No se pudo crear el admin');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
