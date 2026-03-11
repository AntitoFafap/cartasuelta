const fs = require('fs');

async function checkAdmin() {
  const db = require('../lib/db').default || require('../lib/db');
  const email = 'nosino123aa@gmail.com';
  // Verificar que el admin existe
  const [adminRows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
  if (adminRows.length > 0) {
    console.log('Admin encontrado:', adminRows);
  } else {
    console.log('Admin no encontrado');
  }
  // Verificar usuario
  const [userRows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (userRows.length > 0) {
    console.log('Usuario encontrado:', userRows);
  } else {
    console.log('Usuario no encontrado');
  }
}

checkAdmin().catch(console.error);
