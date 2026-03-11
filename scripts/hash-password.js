#!/usr/bin/env node
/**
 * Script para generar contraseña hasheada del admin
 * 
 * Uso:
 * node scripts/hash-password.js micontraseña
 */

const crypto = require('crypto');

function hashPassword(password) {
  if (!password || password.length < 6) {
    console.error('❌ Error: La contraseña debe tener al menos 6 caracteres');
    process.exit(1);
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  
  return `${salt}:${hash}`;
}

// Obtiene contraseña del argumento
const password = process.argv[2];

if (!password) {
  console.error('❌ Error: Debes proporcionar una contraseña');
  console.log('Uso: node scripts/hash-password.js <contraseña>');
  process.exit(1);
}

const hashedPassword = hashPassword(password);

console.log('\n✅ Contraseña hasheada generada:\n');
console.log(`"password": "${hashedPassword}"\n`);
console.log('Copia este valor en data/admins.json\n');
console.log('Ejemplo data/admins.json:');
console.log(`[
  {
    "username": "admin",
    "password": "${hashedPassword}"
  }
]\n`);
