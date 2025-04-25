const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Utilitaires pour la gestion des preuves de création
 */
const proofUtils = {
  /**
   * Génère un hash SHA-256 pour un fichier audio
   * @param {Buffer} audioBuffer Buffer contenant les données audio
   * @returns {string} Hash SHA-256 en hexadécimal
   */
  generateContentHash: (audioBuffer) => {
    const hash = crypto.createHash('sha256');
    hash.update(audioBuffer);
    return hash.digest('hex');
  },

  /**
   * Convertit un hash hexadécimal en tableau d'octets
   * @param {string} hexHash Hash en format hexadécimal
   * @returns {Uint8Array} Tableau d'octets
   */
  hexToBytes: (hexHash) => {
    if (!hexHash.match(/^[0-9a-f]{64}$/i)) {
      throw new Error('Hash invalide: doit être une chaîne hexadécimale de 64 caractères');
    }
    
    const result = new Uint8Array(32);
    for (let i = 0; i < 64; i += 2) {
      result[i / 2] = parseInt(hexHash.substring(i, i + 2), 16);
    }
    
    return result;
  },

  /**
   * Vérifie si un hash correspond à un fichier audio
   * @param {Buffer} audioBuffer Buffer contenant les données audio
   * @param {string} expectedHash Hash attendu en hexadécimal
   * @returns {boolean} true si les hash correspondent, false sinon
   */
  verifyContentHash: (audioBuffer, expectedHash) => {
    const actualHash = proofUtils.generateContentHash(audioBuffer);
    return actualHash === expectedHash;
  },

  /**
   * Génère un fichier JSON de preuve pour le téléchargement
   * @param {Object} proofData Données de la preuve
   * @param {string} outputPath Chemin du fichier de sortie (optionnel)
   * @returns {Object|string} Données JSON ou chemin du fichier écrit
   */
  generateProofJsonFile: (proofData, outputPath = null) => {
    const jsonContent = JSON.stringify(proofData, null, 2);
    
    if (outputPath) {
      fs.writeFileSync(outputPath, jsonContent);
      return outputPath;
    }
    
    return jsonContent;
  },

  /**
   * Crée un dossier temporaire pour les fichiers de preuve si nécessaire
   * @returns {string} Chemin du dossier temporaire
   */
  ensureProofTempDir: () => {
    const tempDir = path.join(__dirname, '../../temp/proofs');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    return tempDir;
  },

  /**
   * Génère un nom de fichier unique pour une preuve
   * @param {string} trackId ID de la piste
   * @param {string} artistId ID de l'artiste
   * @returns {string} Nom de fichier unique
   */
  generateProofFilename: (trackId, artistId) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `proof_${trackId}_${artistId}_${timestamp}.json`;
  }
};

module.exports = proofUtils;