/**
 * Test du module Play
 * Ce script permet de tester les endpoints API du module Play
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';
const API_PATH = '/api/play';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Fonction pour logger avec couleur
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Teste un endpoint API
 */
async function testEndpoint(endpoint, description) {
  const url = `${API_BASE_URL}${API_PATH}${endpoint}`;
  log(`\n🔍 Test de l'endpoint: ${url}`, 'cyan');
  log(`📝 Description: ${description}`, 'blue');
  
  try {
    const startTime = Date.now();
    const response = await axios.get(url);
    const duration = Date.now() - startTime;
    
    log(`✅ Statut: ${response.status} (${duration}ms)`, 'green');
    log('📊 Données reçues:', 'magenta');
    console.log(JSON.stringify(response.data, null, 2));
    
    return { success: true, data: response.data, duration };
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    
    if (error.response) {
      log('📊 Réponse d\'erreur:', 'yellow');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    
    return { success: false, error };
  }
}

/**
 * Fonction principale pour exécuter tous les tests
 */
async function runTests() {
  log('🚀 Démarrage des tests du module Play...', 'cyan');
  
  // Test 1: Récupérer un morceau aléatoire
  await testEndpoint('/random', 'Récupère un morceau SoundCloud aléatoire');
  
  // Test 2: Récupérer tous les morceaux
  await testEndpoint('/tracks', 'Récupère la liste de tous les morceaux disponibles');
  
  // Test 3: Récupérer la configuration du widget
  await testEndpoint('/config', 'Récupère la configuration du widget SoundCloud');
  
  log('\n🏁 Tests terminés!', 'green');
}

// Exécuter les tests
runTests().catch(error => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});
