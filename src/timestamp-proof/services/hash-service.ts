import crypto from 'crypto';

/**
 * Service pour générer et vérifier les hash cryptographiques
 * des fichiers audio pour les preuves de création
 */
export class HashService {
  /**
   * Génère un hash SHA-256 à partir d'un buffer audio
   * @param audioBuffer Buffer contenant les données audio
   * @returns Le hash SHA-256 en hexadécimal
   */
  static generateContentHash(audioBuffer: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(audioBuffer);
    return hash.digest('hex');
  }

  /**
   * Convertit un hash hexadécimal en tableau d'octets (Uint8Array)
   * pour être utilisé avec les instructions Anchor
   * @param hexHash Hash en format hexadécimal
   * @returns Uint8Array de 32 octets
   */
  static hexToBytes(hexHash: string): Uint8Array {
    if (!hexHash.match(/^[0-9a-f]{64}$/i)) {
      throw new Error('Hash invalide: doit être une chaîne hexadécimale de 64 caractères');
    }
    
    const result = new Uint8Array(32);
    for (let i = 0; i < 64; i += 2) {
      result[i / 2] = parseInt(hexHash.substring(i, i + 2), 16);
    }
    
    return result;
  }

  /**
   * Convertit un tableau d'octets en chaîne hexadécimale
   * @param bytes Tableau d'octets (Uint8Array)
   * @returns Chaîne hexadécimale
   */
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Vérifie si un hash correspond à un fichier audio
   * @param audioBuffer Buffer contenant les données audio
   * @param expectedHash Hash attendu en hexadécimal
   * @returns true si les hash correspondent, false sinon
   */
  static verifyContentHash(audioBuffer: Buffer, expectedHash: string): boolean {
    const actualHash = this.generateContentHash(audioBuffer);
    return actualHash === expectedHash;
  }
}