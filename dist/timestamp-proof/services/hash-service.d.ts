/**
 * Service pour générer et vérifier les hash cryptographiques
 * des fichiers audio pour les preuves de création
 */
export declare class HashService {
    /**
     * Génère un hash SHA-256 à partir d'un buffer audio
     * @param audioBuffer Buffer contenant les données audio
     * @returns Le hash SHA-256 en hexadécimal
     */
    static generateContentHash(audioBuffer: Buffer): string;
    /**
     * Convertit un hash hexadécimal en tableau d'octets (Uint8Array)
     * pour être utilisé avec les instructions Anchor
     * @param hexHash Hash en format hexadécimal
     * @returns Uint8Array de 32 octets
     */
    static hexToBytes(hexHash: string): Uint8Array;
    /**
     * Convertit un tableau d'octets en chaîne hexadécimale
     * @param bytes Tableau d'octets (Uint8Array)
     * @returns Chaîne hexadécimale
     */
    static bytesToHex(bytes: Uint8Array): string;
    /**
     * Vérifie si un hash correspond à un fichier audio
     * @param audioBuffer Buffer contenant les données audio
     * @param expectedHash Hash attendu en hexadécimal
     * @returns true si les hash correspondent, false sinon
     */
    static verifyContentHash(audioBuffer: Buffer, expectedHash: string): boolean;
}
