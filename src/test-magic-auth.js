/**
 * Script de test pour l'authentification Magic.link et Account Abstraction
 * 
 * Instructions:
 * 1. Exécutez ce script pour simuler une authentification complète
 * 2. Assurez-vous que votre serveur est en cours d'exécution
 * 3. Utilisez un token DID Magic valide pour le test
 */

const axios = require('axios');
const { Magic } = require('@magic-sdk/admin');
const dotenv = require('dotenv');

dotenv.config();

// Configuration
const API_URL = 'http://localhost:5001/api';
const MAGIC_SECRET_KEY = process.env.MAGIC_SECRET_KEY;

// Créer une instance Magic.link Admin
const magic = new Magic(MAGIC_SECRET_KEY);

// Token DID à fournir manuellement pour le test
// En production, ce token serait envoyé par le frontend après l'authentification de l'utilisateur
const TEST_DID_TOKEN = 'votre_did_token_test_ici';

// Fonction pour tester l'authentification Magic
async function testMagicAuth() {
  try {
    console.log('=== TEST AUTHENTIFICATION MAGIC ET ACCOUNT ABSTRACTION ===');
    
    // 1. Valider le token DID pour s'assurer qu'il est légitime
    try {
      magic.token.validate(TEST_DID_TOKEN);
      console.log('✅ Token DID validé');
    } catch (error) {
      console.error('❌ Token DID invalide:', error.message);
      return;
    }
    
    // 2. Obtenir les métadonnées utilisateur pour afficher les infos
    try {
        const metadata = await magic.users.getMetadataByToken(TEST_DID_TOKEN);
        console.log('✅ Métadonnées récupérées:');
        console.log(`   - Email: ${metadata.email}`);
        console.log(`   - Public Address: ${metadata.publicAddress}`);
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des métadonnées:', error.message);
        return;
      }
  
      // 3. Envoyer le token au backend pour simuler une requête authentifiée
      try {
        const response = await axios.get(`${API_URL}/user`, {
          headers: {
            Authorization: `Bearer ${TEST_DID_TOKEN}`,
          },
        });
  
        console.log('✅ Réponse du serveur :', response.data);
      } catch (error) {
        console.error('❌ Erreur lors de l’appel au backend:', error.message);
      }
  
    } catch (err) {
      console.error('❌ Erreur générale:', err.message);
    }
  }
  
  testMagicAuth();
  