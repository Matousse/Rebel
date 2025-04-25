/**
 * Script de test pour la fonctionnalité Proof of Creation
 * 
 * Ce script teste la fonctionnalité de bout en bout:
 * 1. Authentification avec Magic.link
 * 2. Upload d'un morceau de musique
 * 3. Création d'un timestamp (Proof of Creation)
 * 4. Vérification du timestamp
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const readline = require('readline');

// Configuration (À MODIFIER)
const API_URL = 'http://localhost:5001/api';
const TEST_AUDIO_PATH = path.join(__dirname, 'test-audio.mp3'); // Chemin vers un fichier audio de test

// Variables globales
let authToken = null;
let trackId = null;

// Fonction utilitaire pour l'entrée utilisateur
function readUserInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Fonction pour tester l'auth Magic
async function authenticateWithMagic() {
  try {
    console.log('\n=== 1. AUTHENTIFICATION AVEC MAGIC.LINK ===');
    
    // Cette étape nécessite une intervention manuelle pour obtenir un token DID
    console.log('Pour obtenir un token DID Magic:');
    console.log('1. Exécutez le serveur de test Magic: cd magic-test && node server.js');
    console.log('2. Ouvrez http://localhost:3000 et connectez-vous avec votre email');
    console.log('3. Copiez le token DID de la console du navigateur');
    
    // Attendre que l'utilisateur entre le token DID
    const didToken = await readUserInput('\nVeuillez coller votre token DID Magic: ');
    
    if (!didToken || didToken.trim() === '') {
      throw new Error('Token DID vide ou invalide');
    }
    
    // S'authentifier auprès de l'API
    console.log('\nAuthentification en cours...');
    const authResponse = await axios.post(`${API_URL}/magic/auth`, {
      didToken,
      username: `testuser_${Date.now().toString().slice(-4)}`
    });
    
    if (!authResponse.data.success) {
      throw new Error('Authentification échouée');
    }
    
    authToken = authResponse.data.token;
    const userId = authResponse.data.user.id;
    
    console.log(`✅ Authentifié avec succès. User ID: ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ ERREUR PENDANT L\'AUTHENTIFICATION:', error.message);
    if (error.response) {
      console.error('Détails:', error.response.data);
    }
    return false;
  }
}

// Fonction pour uploader un morceau
async function uploadTrack() {
  try {
    console.log('\n=== 2. UPLOAD D\'UN MORCEAU ===');
    
    // Vérifier si le fichier audio existe
    if (!fs.existsSync(TEST_AUDIO_PATH)) {
      console.log('⚠️ Fichier audio de test non trouvé. Création d\'un fichier de test...');
      
      // Si le fichier n'existe pas, créer un fichier binaire simple
      const buffer = Buffer.alloc(1024 * 500); // 500KB de données aléatoires
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
      
      // Assurez-vous que le répertoire existe
      const dir = path.dirname(TEST_AUDIO_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(TEST_AUDIO_PATH, buffer);
      console.log(`Fichier de test créé: ${TEST_AUDIO_PATH}`);
    }
    
    // Préparer les données du formulaire
    const formData = new FormData();
    formData.append('title', `Test Track ${Date.now()}`);
    formData.append('genre', 'Electronic');
    formData.append('description', 'Track for testing Proof of Creation');
    formData.append('audioFile', fs.createReadStream(TEST_AUDIO_PATH));
    
    console.log('Upload du morceau en cours...');
    const uploadResponse = await axios.post(
      `${API_URL}/tracks`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (!uploadResponse.data.success) {
      throw new Error('Upload du morceau échoué');
    }
    
    trackId = uploadResponse.data.data._id;
    console.log(`✅ Morceau uploadé avec succès. Track ID: ${trackId}`);
    return true;
  } catch (error) {
    console.error('❌ ERREUR PENDANT L\'UPLOAD:', error.message);
    if (error.response) {
      console.error('Détails:', error.response.data);
    }
    return false;
  }
}

// Fonction pour créer un timestamp (Proof of Creation)
async function createTimestamp() {
  try {
    console.log('\n=== 3. CRÉATION DU TIMESTAMP (PROOF OF CREATION) ===');
    
    console.log('Génération du timestamp en cours...');
    const timestampResponse = await axios.post(
      `${API_URL}/tracks/${trackId}/timestamp`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (!timestampResponse.data.success) {
      throw new Error('Création du timestamp échouée');
    }
    
    console.log('✅ Timestamp créé avec succès:');
    console.log(JSON.stringify(timestampResponse.data.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ ERREUR PENDANT LA CRÉATION DU TIMESTAMP:', error.message);
    if (error.response) {
      console.error('Détails:', error.response.data);
    }
    return false;
  }
}

// Fonction pour vérifier un timestamp
async function verifyTimestamp() {
  try {
    console.log('\n=== 4. VÉRIFICATION DU TIMESTAMP ===');
    
    console.log('Vérification du timestamp en cours...');
    const verifyResponse = await axios.get(
      `${API_URL}/tracks/${trackId}/verify`
    );
    
    if (!verifyResponse.data.success) {
      throw new Error('Vérification du timestamp échouée');
    }
    
    const { isValid } = verifyResponse.data.data;
    
    if (isValid) {
      console.log('✅ Timestamp vérifié avec succès! Le morceau est authentique.');
    } else {
      console.log('⚠️ Timestamp invalide. Le morceau pourrait avoir été modifié.');
    }
    
    console.log('Détails de la vérification:');
    console.log(JSON.stringify(verifyResponse.data.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ ERREUR PENDANT LA VÉRIFICATION DU TIMESTAMP:', error.message);
    if (error.response) {
      console.error('Détails:', error.response.data);
    }
    return false;
  }
}

// Fonction principale pour exécuter le test complet
async function runFullTest() {
  console.log('=== TEST DE FONCTIONNALITÉ PROOF OF CREATION ===');
  console.log('Ce test va tester la fonctionnalité de bout en bout.\n');
  
  // Étape 1: Authentification
  const authSuccess = await authenticateWithMagic();
  if (!authSuccess) {
    console.error('❌ TEST ÉCHOUÉ: Impossible de s\'authentifier');
    return;
  }
  
  // Étape 2: Upload de morceau
  const uploadSuccess = await uploadTrack();
  if (!uploadSuccess) {
    console.error('❌ TEST ÉCHOUÉ: Impossible d\'uploader le morceau');
    return;
  }
  
  // Étape 3: Création de timestamp
  const timestampSuccess = await createTimestamp();
  if (!timestampSuccess) {
    console.error('❌ TEST ÉCHOUÉ: Impossible de créer le timestamp');
    return;
  }
  
  // Étape 4: Vérification de timestamp
  const verifySuccess = await verifyTimestamp();
  if (!verifySuccess) {
    console.error('❌ TEST ÉCHOUÉ: Impossible de vérifier le timestamp');
    return;
  }
  
  console.log('\n✅✅✅ TEST COMPLET RÉUSSI! La fonctionnalité Proof of Creation fonctionne correctement.');
}

// Exécuter le test
runFullTest().catch(error => {
  console.error('❌ ERREUR GÉNÉRALE:', error);
});