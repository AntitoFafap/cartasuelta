const fs = require('fs');
const crypto = require('crypto');

// IMPORTANTE: Usar 1000 iteraciones como en lib/security.js
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
}

async function fixPasswords() {
  const db = require('../lib/db').default || require('../lib/db');
  const passwordHash = hashPassword('papasuprema');
  console.log('Hash generado:', passwordHash.substring(0, 50) + '...');
  // Actualizar usuario
  const email = 'nosino123aa@gmail.com';
  const [userRows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (userRows[0]) {
    await db.query('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, userRows[0].id]);
    console.log('Usuario actualizado:', userRows[0].id);
  } else {
    console.log('Usuario no encontrado');
  }
  // Actualizar admin
  const [adminRows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
  if (adminRows[0]) {
    await db.query('UPDATE admins SET passwordHash = ? WHERE id = ?', [passwordHash, adminRows[0].id]);
    console.log('Admin actualizado:', adminRows[0].id);
  } else {
    console.log('Admin no encontrado');
  }
}
  
  console.log('\n🔑 Credenciales actualizadas:');
  console.log('   Email: nosino123aa@gmail.com');
  console.log('   Contraseña: papasuprema');
}

fixPasswords().catch(console.error);
