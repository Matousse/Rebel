import { Keypair, PublicKey } from '@solana/web3.js';
/**
 * Client pour interagir avec le programme Anchor timestamp_proof
 */
export declare class TimestampProofClient {
    private connection;
    private program;
    private provider;
    /**
     * Initialise le client avec un keypair pour payer les transactions
     * @param payerKeypair Keypair pour payer les frais de transaction
     */
    constructor(payerKeypair: Keypair);
    /**
     * Dérive l'adresse PDA pour une preuve de création
     * @param artistPublicKey Clé publique de l'artiste
     * @param trackHash Hash du track en bytes
     * @returns Adresse PDA et bump
     */
    deriveProofPDA(artistPublicKey: PublicKey, trackHash: Uint8Array): Promise<[PublicKey, number]>;
    /**
     * Crée une nouvelle preuve de création
     * @param artistKeypair Keypair de l'artiste (pour signer)
     * @param trackHash Hash du fichier audio en Uint8Array
     * @returns Signature de la transaction
     */
    mintProofOfCreation(artistKeypair: Keypair, trackHash: Uint8Array): Promise<string>;
    /**
     * Récupère les informations d'une preuve de création
     * @param artistPublicKey Clé publique de l'artiste
     * @param trackHash Hash du fichier audio en Uint8Array
     * @returns Données de la preuve de création ou null si non trouvée
     */
    getProofOfCreation(artistPublicKey: PublicKey, trackHash: Uint8Array): Promise<{
        artist: string;
        trackHash: Uint8Array;
        timestamp: number;
        pdaAddress: string;
    } | null>;
    /**
     * Vérifie si une preuve de création existe
     * @param artistPublicKey Clé publique de l'artiste
     * @param trackHash Hash du fichier audio
     * @returns true si la preuve existe, false sinon
     */
    proofExists(artistPublicKey: PublicKey, trackHash: Uint8Array): Promise<boolean>;
}
