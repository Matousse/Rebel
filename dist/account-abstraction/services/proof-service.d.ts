import { SolanaService } from './solana-service';
export interface ProofCreationResult {
    success: boolean;
    trackId: string;
    timestamp: number;
    signature?: string;
    transactionId?: string;
    error?: string;
}
export declare class ProofService {
    private solanaService;
    constructor(solanaService: SolanaService);
    /**
     * Créer une preuve de création pour un morceau musical
     * @param trackId Identifiant du morceau
     * @param userId Identifiant de l'utilisateur
     * @param metadata Métadonnées du morceau à inclure dans la preuve
     */
    createProofOfCreation(trackId: string, userId: string, metadata: Record<string, any>): Promise<ProofCreationResult>;
    /**
     * Vérifie l'existence d'une preuve sur la blockchain
     * @param signature Signature de la transaction
     */
    verifyProof(signature: string): Promise<boolean>;
}
