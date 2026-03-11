const fs = require('fs');
const path = require('path');

// Leer el archivo JSON desde la raíz del proyecto
const adminsPath = path.join(__dirname, '..', 'data', 'admins.json');
const adminsData = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));

console.log('🚀 Iniciando migración de administradores...\n');

const roleMap = {
  'Super Admin': 'superadmin',
  'Moderator': 'moderator',

};

// Simular la migración en memoria (para demostración)
const migratedAdmins = adminsData.map(admin => {
  const role = roleMap[admin.role] || 'moderator';
  console.log(`✓ Admin migrado: ${admin.username} (${role})`);
  
  return {
    username: admin.username,
    email: admin.email,
    passwordHash: admin.password,
    fullName: admin.username,
    role: role,
    isActive: true,
    createdAt: admin.createdAt,
    updatedAt: new Date().toISOString(),
  };
});

console.log(`\n✅ Migración completada!`);
console.log(`Total de administradores migrados: ${migratedAdmins.length}`);
console.log(`\nAdministradores:`);
migratedAdmins.forEach(admin => {
  console.log(`  - ${admin.username} (${admin.email}) - Role: ${admin.role}`);
});

console.log('\n📝 Nota: Los datos deben migrarse a la base de datos MySQL.');
console.log('El archivo data/admins.json sigue disponible como respaldo.\n');
