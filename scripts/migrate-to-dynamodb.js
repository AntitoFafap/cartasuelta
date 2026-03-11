/**
 * Script para migrar datos de archivos JSON a DynamoDB via GraphQL
 * 
 * Uso: node scripts/migrate-to-dynamodb.js
 */

const fs = require('fs');
const path = require('path');

// Eliminar lógica de Amplify/DynamoDB
// Este script ya no es necesario. Migración debe hacerse a MySQL.
console.log('Este script ya no es necesario. Migración debe hacerse a MySQL.');
process.exit(0);

// Mapeo de idiomas
const LANGUAGE_MAP = {
  'Spanish': 'Espanol',
  'Español': 'Espanol',
  'English': 'Ingles',
  'Inglés': 'Ingles',
  'Japanese': 'Japones',
  'Japonés': 'Japones',
  'French': 'Frances',
  'Francés': 'Frances',
  'German': 'Aleman',
  'Alemán': 'Aleman',
  'Italian': 'Italiano',
  'Portuguese': 'Portugues',
  'Portugués': 'Portugues',
  'Chinese': 'Chino',
};

// Mapeo de condiciones
const CONDITION_MAP = {
  'Mint': 'Mint',
  'Near Mint': 'NearMint',
  'NearMint': 'NearMint',
  'Lightly Played': 'LightlyPlayed',
  'LightlyPlayed': 'LightlyPlayed',
  'Moderately Played': 'ModeratelyPlayed',
  'ModeratelyPlayed': 'ModeratelyPlayed',
  'Heavily Played': 'HeavilyPlayed',
  'HeavilyPlayed': 'HeavilyPlayed',
  'Damaged': 'Damaged',
};

async function graphqlRequest(query, variables) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

// ==================== MIGRAR CARDS ====================

const CREATE_CARD_MUTATION = `
  mutation CreateCard($input: CreateCardInput!) {
    createCard(input: $input) {
      id
      name
    }
  }
`;

async function migrateCards() {
  const cardsPath = path.join(__dirname, '..', 'data', 'cards.json');
  
  if (!fs.existsSync(cardsPath)) {
    console.log('⚠️  No existe cards.json, saltando migración de cards');
    return;
  }

  const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
  
  if (!cards || cards.length === 0) {
    console.log('⚠️  cards.json está vacío');
    return;
  }

  console.log(`\n📦 Migrando ${cards.length} cartas a DynamoDB...`);

  let success = 0;
  let failed = 0;

  for (const card of cards) {
    try {
      // Extraer nombre del set si es objeto
      const setName = typeof card.set === 'object' ? card.set.name : card.set;
      
      const input = {
        name: card.name,
        set: setName || '',
        number: card.number || card.tcgdexId || '',
        rarity: card.rarity || 'Común',
        price: parseFloat(card.price) || 0,
        originalPrice: card.originalPrice ? parseFloat(card.originalPrice) : null,
        image: card.imageUrl || card.image || null,
        stock: parseInt(card.stock) || 0,
        description: card.cardType || 'Pokémon',
      };

      const result = await graphqlRequest(CREATE_CARD_MUTATION, { input });

      if (result.errors) {
        console.error(`❌ Error migrando carta "${card.name}":`, result.errors[0].message);
        failed++;
      } else {
        console.log(`✅ Migrada: ${card.name}`);
        success++;
      }
    } catch (e) {
      console.error(`❌ Error migrando carta "${card.name}":`, e.message);
      failed++;
    }

    // Pequeña pausa para no saturar la API
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n📊 Cards: ${success} migradas, ${failed} fallidas`);
}

// ==================== MIGRAR INVENTORY ====================

const CREATE_INVENTORY_MUTATION = `
  mutation CreateCardInventory($input: CreateCardInventoryInput!) {
    createCardInventory(input: $input) {
      id
      name
    }
  }
`;

async function migrateInventory() {
  const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.json');
  
  if (!fs.existsSync(inventoryPath)) {
    console.log('⚠️  No existe inventory.json, saltando migración de inventario');
    return;
  }

  const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  
  if (!inventory || inventory.length === 0) {
    console.log('⚠️  inventory.json está vacío');
    return;
  }

  console.log(`\n📦 Migrando ${inventory.length} items de inventario a DynamoDB...`);

  let success = 0;
  let failed = 0;

  for (const item of inventory) {
    try {
      // Mapear language y condition a los enums de DynamoDB
      const language = LANGUAGE_MAP[item.language] || 'Espanol';
      const condition = CONDITION_MAP[item.condition] || 'LightlyPlayed';

      const input = {
        name: item.name,
        set: item.set || '',
        cardNumber: item.cardNumber || item.number || null,
        imageUrl: item.imageUrl || 'https://via.placeholder.com/150',
        price: parseFloat(item.price) || 0,
        stock: parseInt(item.stock) || 0,
        language: language,
        condition: condition,
        cardType: item.cardType || 'Pokémon',
        tcgdexId: item.tcgdexId || null,
        description: item.rarity || item.description || null,
      };

      const result = await graphqlRequest(CREATE_INVENTORY_MUTATION, { input });

      if (result.errors) {
        console.error(`❌ Error migrando item "${item.name}":`, result.errors[0].message);
        failed++;
      } else {
        console.log(`✅ Migrado: ${item.name}`);
        success++;
      }
    } catch (e) {
      console.error(`❌ Error migrando item "${item.name}":`, e.message);
      failed++;
    }

    // Pequeña pausa para no saturar la API
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n📊 Inventory: ${success} migrados, ${failed} fallidos`);
}

// ==================== MIGRAR ADMINS ====================

const CREATE_ADMIN_MUTATION = `
  mutation CreateAdmin($input: CreateAdminInput!) {
    createAdmin(input: $input) {
      id
      username
    }
  }
`;

async function migrateAdmins() {
  const adminsPath = path.join(__dirname, '..', 'data', 'admins-init.json');
  
  if (!fs.existsSync(adminsPath)) {
    console.log('⚠️  No existe admins-init.json, saltando migración de admins');
    return;
  }

  const admins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
  
  if (!admins || admins.length === 0) {
    console.log('⚠️  admins-init.json está vacío');
    return;
  }

  console.log(`\n👤 Migrando ${admins.length} administradores a DynamoDB...`);

  let success = 0;
  let failed = 0;

  for (const admin of admins) {
    try {
      const input = {
        username: admin.username,
        email: admin.email,
        passwordHash: admin.passwordHash,
        fullName: admin.fullName || null,
        role: admin.role || 'moderator',
        isActive: admin.isActive !== false,
      };

      const result = await graphqlRequest(CREATE_ADMIN_MUTATION, { input });

      if (result.errors) {
        // Verificar si es error de duplicado
        if (result.errors[0].message.includes('already exists')) {
          console.log(`⏭️  Admin "${admin.username}" ya existe, saltando`);
        } else {
          console.error(`❌ Error migrando admin "${admin.username}":`, result.errors[0].message);
          failed++;
        }
      } else {
        console.log(`✅ Migrado: ${admin.username}`);
        success++;
      }
    } catch (e) {
      console.error(`❌ Error migrando admin "${admin.username}":`, e.message);
      failed++;
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n📊 Admins: ${success} migrados, ${failed} fallidos`);
}

// ==================== MAIN ====================

async function main() {
  console.log('🚀 Iniciando migración a DynamoDB...');
  console.log(`📍 GraphQL URL: ${GRAPHQL_URL}`);
  console.log('');

  try {
    await migrateCards();
    await migrateInventory();
    await migrateAdmins();

    console.log('\n✨ Migración completada!');
  } catch (e) {
    console.error('\n💥 Error durante la migración:', e.message);
    process.exit(1);
  }
}

main();
