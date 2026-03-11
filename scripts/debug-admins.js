// Script para depurar y limpiar admins duplicados usando MySQL
const db = require('../lib/db').default || require('../lib/db');

async function listAllAdmins() {
  const [admins] = await db.query('SELECT * FROM admins');
  return admins;
}

async function deleteAdminById(id) {
  await db.query('DELETE FROM admins WHERE id = ?', [id]);
  console.log('Admin eliminado:', id);
}

async function main() {
  console.log('=== Listando todos los admins ===');
  const admins = await listAllAdmins();
  console.log('Total admins:', admins.length);
  admins.forEach(a => console.log(`- ${a.id} | ${a.username} | ${a.role}`));

  // Encontrar duplicados
  const usernameCounts = {};
  admins.forEach(a => {
    usernameCounts[a.username] = (usernameCounts[a.username] || 0) + 1;
  });

  const duplicates = Object.entries(usernameCounts).filter(([_, count]) => count > 1);
  console.log('\n=== Duplicados encontrados ===');
  duplicates.forEach(([username, count]) => console.log(`${username}: ${count} registros`));

  // Preguntar si eliminar duplicados
  if (duplicates.length > 0 && process.argv.includes('--clean')) {
    console.log('\n=== Eliminando duplicados (manteniendo el primero) ===');
    for (const [username] of duplicates) {
      const userAdmins = admins.filter(a => a.username === username);
      // Mantener el primero, eliminar el resto
      for (let i = 1; i < userAdmins.length; i++) {
        await deleteAdminById(userAdmins[i].id);
      }
    }
  }
}

main().catch(console.error);
