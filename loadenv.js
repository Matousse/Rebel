const path = require('path');
const fs = require('fs');

// Charger manuellement le fichier .env
const envPath = path.join(__dirname, '.env');
console.log('🔍 Looking for .env file at:', envPath);

if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  require('dotenv').config({ path: envPath });
  
  // Vérifier que les variables sont chargées
  console.log('ADMIN_PRIVATE_KEY loaded:', !!process.env.ADMIN_PRIVATE_KEY);
  console.log('MAGIC_SECRET_KEY loaded:', !!process.env.MAGIC_SECRET_KEY);
} else {
  console.error('❌ .env file not found at:', envPath);
}

module.exports = {};