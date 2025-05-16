/**
 * Métadonnées de la preuve de création
 */
export interface ProofMetadata {
    artistId: string;
    artistPublicKey: string;
    trackId: string;
    title: string;
    contentHash: string;
    contentHashBytes: Uint8Array;
    createdAt: number;
}
/**
 * Statut de la preuve
 */
export type ProofStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';
/**
 * Preuve de création complète
 */
export interface CreationProof {
    id: string;
    metadata: ProofMetadata;
    transactionId?: string;
    pdaAddress?: string;
    status: ProofStatus;
    version: number;
    isPaid: boolean;
    cost: number;
}
/**
 * Paramètres pour créer une nouvelle preuve
 */
export interface ProofCreationParams {
    trackId: string;
    artistId: string;
    artistPublicKey: string;
    title: string;
    audioBuffer: Buffer;
}
/**
 * Résultat de vérification d'une preuve
 */
export interface ProofVerificationResult {
    isValid: boolean;
    originalTimestamp?: number;
    onChain: boolean;
    pdaAddress?: string;
    details?: string;
}
/**
 * Format du fichier JSON de preuve pour téléchargement
 */
export interface ProofJson {
    artist_id: string;
    track_hash: string;
    track_id: string;
    track_title: string;
    timestamp: {
        unix: number;
        iso: string;
    };
    nft_id: string;
    transaction_id?: string;
}
