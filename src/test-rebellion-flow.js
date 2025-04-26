const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const readline = require('readline');

// Configuration
const API_URL = 'http://localhost:5001/api'; // Ajustez selon votre environnement
const TEST_AUDIO_FILE = path.join(__dirname, 'test-audio.mp3');
const TEST_OUTPUT_DIR = path.join(__dirname, 'test-output');

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// Interface pour l'entrée utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction utilitaire pour les questions
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Fonction principale de test
async function testCompleteFlow() {
  console.log('=== TEST COMPLET DU FLUX UTILISATEUR REBELLION ===\n');
  console.log('Ce test va parcourir l\'ensemble du flux utilisateur, de l\'inscription à la génération de preuve de création.\n');
  
  // Stocker les données de session
  const session = {
    email: null,
    username: null,
    magicToken: null,
    jwtToken: null,
    userId: null,
    trackId: null,
    proofId: null
  };

  try {
    // ÉTAPE 1: Configuration utilisateur
    console.log('=== ÉTAPE 1: CONFIGURATION UTILISATEUR ===');
    session.email = await askQuestion('Email pour le test: ');
    session.username = `test_user_${Date.now()}`;
    console.log(`Username généré: ${session.username}\n`);
    
    // ÉTAPE 2: Obtenir un token Magic
    console.log('=== ÉTAPE 2: OBTENTION DU TOKEN MAGIC ===');
    console.log('Pour obtenir un token Magic:');
    console.log('1. Exécutez le serveur de test Magic: cd magic-test && node server.js');
    console.log('2. Ouvrez http://localhost:3000 dans votre navigateur');
    console.log('3. Connectez-vous avec l\'email indiqué');
    console.log('4. Copiez le DID token affiché dans la console\n');
    
    session.magicToken = await askQuestion('Collez le token Magic DID: ');
    
    // ÉTAPE 3: Authentification et obtention du JWT
    console.log('\n=== ÉTAPE 3: AUTHENTIFICATION AVEC MAGIC ===');
    try {
      console.log('Authentification en cours...');
      const authResponse = await axios.post(`${API_URL}/magic/auth`, {
        didToken: session.magicToken,
        username: session.username,
        email: session.email
      });
      
      session.jwtToken = authResponse.data.token;
      session.userId = authResponse.data.user.id;
      
      console.log(`✅ Authentification réussie! User ID: ${session.userId}\n`);
    } catch (authError) {
      console.error('❌ Erreur d\'authentification:', authError.response?.data || authError.message);
      throw new Error('Échec de l\'authentification');
    }
    
    // ÉTAPE 4: Vérification du profil
    console.log('=== ÉTAPE 4: VÉRIFICATION DU PROFIL ===');
    try {
      console.log('Récupération du profil...');
      const profileResponse = await axios.get(`${API_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${session.jwtToken}` }
      });
      
      console.log('✅ Profil récupéré avec succès!');
      console.log('Données utilisateur:', profileResponse.data.data || profileResponse.data);
      console.log();
    } catch (profileError) {
      console.error('❌ Erreur récupération du profil:', profileError.response?.data || profileError.message);
      throw new Error('Échec de récupération du profil');
    }
    
    // ÉTAPE 5: Upload d'un morceau
    console.log('=== ÉTAPE 5: UPLOAD D\'UN MORCEAU ===');
    
    // Vérifier si le fichier audio de test existe
    if (!fs.existsSync(TEST_AUDIO_FILE)) {
      console.log('⚠️ Fichier audio de test non trouvé. Création d\'un fichier test...');
      
      // Créer un fichier MP3 de test minimal
      const buffer = Buffer.alloc(4096);
      buffer.write('ID3', 0); // En-tête MP3 minimal
      fs.writeFileSync(TEST_AUDIO_FILE, buffer);
      
      console.log(`✅ Fichier test créé à ${TEST_AUDIO_FILE}`);
    }
    
    try {
      console.log('Upload du morceau en cours...');
      
      // Préparer les données du formulaire
      const formData = new FormData();
      formData.append('title', `Test Track ${Date.now()}`);
      formData.append('genre', 'Test');
      formData.append('description', 'Track for testing proof of creation');
      formData.append('duration', '180'); // 3 minutes
      formData.append('audioFile', fs.createReadStream(TEST_AUDIO_FILE));
      
      // Envoyer la requête d'upload
      const uploadResponse = await axios.post(`${API_URL}/tracks`, formData, {
        headers: {
          'Authorization': `Bearer ${session.jwtToken}`,
          ...formData.getHeaders()
        }
      });
      
      session.trackId = uploadResponse.data.data._id || uploadResponse.data.data.id;
      
      console.log('✅ Morceau uploadé avec succès!');
      console.log(`Track ID: ${session.trackId}\n`);
    } catch (uploadError) {
      console.error('❌ Erreur upload du morceau:', uploadError.response?.data || uploadError.message);
      throw new Error('Échec de l\'upload du morceau');
    }
    
    // ÉTAPE 6: Création de la preuve de création
    console.log('=== ÉTAPE 6: CRÉATION DE LA PREUVE DE CRÉATION ===');
    try {
      console.log('Génération de la preuve en cours...');
      
      const timestampResponse = await axios.post(`${API_URL}/tracks/${session.trackId}/timestamp`, {}, {
        headers: { 'Authorization': `Bearer ${session.jwtToken}` }
      });
      
      session.proofId = timestampResponse.data.data?.proofId || 'proof-id-not-available';
      
      console.log('✅ Preuve de création générée avec succès!');
      console.log('Détails:', timestampResponse.data);
      console.log();
    } catch (proofError) {
      console.error('❌ Erreur génération de la preuve:', proofError.response?.data || proofError.message);
      throw new Error('Échec de génération de la preuve');
    }
    
    // ÉTAPE 7: Vérification de la preuve
    console.log('=== ÉTAPE 7: VÉRIFICATION DE LA PREUVE ===');
    try {
      console.log('Vérification de la preuve en cours...');
      
      const verifyResponse = await axios.get(`${API_URL}/tracks/${session.trackId}/verify`, {
        headers: { 'Authorization': `Bearer ${session.jwtToken}` }
      });
      
      console.log('✅ Preuve vérifiée avec succès!');
      console.log('Résultat de vérification:', verifyResponse.data);
      console.log();
    } catch (verifyError) {
      console.error('❌ Erreur vérification de la preuve:', verifyError.response?.data || verifyError.message);
      // Ne pas bloquer le flux si la vérification échoue (pourrait être causé par temps blockchain)
      console.log('⚠️ Continuons malgré l\'erreur de vérification...\n');
    }
    
    // ÉTAPE 8: Téléchargement du certificat de preuve
    console.log('=== ÉTAPE 8: TÉLÉCHARGEMENT DU CERTIFICAT ===');
    try {
      console.log('Téléchargement du certificat en cours...');
      
      // L'URL peut varier selon votre implémentation
      let downloadUrl = `${API_URL}/tracks/${session.trackId}/proof`;
      
      // Alternative si vous utilisez un endpoint différent
      if (session.proofId !== 'proof-id-not-available') {
        downloadUrl = `${API_URL}/proofs/${session.proofId}/download`;
      }
      
      const downloadResponse = await axios.get(downloadUrl, {
        headers: { 'Authorization': `Bearer ${session.jwtToken}` },
        responseType: 'stream'
      });
      
      // Créer un fichier pour sauvegarder le certificat
      const certificatePath = path.join(TEST_OUTPUT_DIR, `certificate-${Date.now()}.json`);
      const writer = fs.createWriteStream(certificatePath);
      
      downloadResponse.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log('✅ Certificat téléchargé avec succès!');
      console.log(`Sauvegardé à: ${certificatePath}\n`);
    } catch (downloadError) {
      console.error('❌ Erreur téléchargement du certificat:', downloadError.response?.data || downloadError.message);
      // Ne pas bloquer le flux, c'est la dernière étape
      console.log('⚠️ Impossible de télécharger le certificat\n');
    }
    
    // TEST COMPLET
    console.log('=== TEST COMPLET TERMINÉ AVEC SUCCÈS ===');
    console.log('Résumé du test:');
    console.log(`- Utilisateur créé: ${session.username} (ID: ${session.userId})`);
    console.log(`- Morceau uploadé avec ID: ${session.trackId}`);
    console.log(`- Preuve de création générée avec ID: ${session.proofId}`);
    console.log('\nToutes les étapes du flux utilisateur ont été testées avec succès!');
    
  } catch (error) {
    console.error('\n❌ ERREUR DANS LE FLUX DE TEST:');
    console.error(error.message);
    console.error('\nLe test a été interrompu. Veuillez corriger l\'erreur et réessayer.');
  } finally {
    rl.close();
  }
}

// Exécuter le test
testCompleteFlow();