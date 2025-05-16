import { SolanaService } from '../../account-abstraction/services/solana-service';
import { ProofCreationParams, CreationProof, ProofVerificationResult, ProofJson } from '../interfaces/types';
/**
 * Service principal pour la gestion des preuves de création horodatées
 */
export declare class ProofService {
    private solanaService;
    private anchorClient;
    private proofs;
    /**
     * Initialise le service avec le service Solana existant
     * @param solanaService Service Solana de l'application
     */
    constructor(solanaService: SolanaService);
    /**
     * Crée une nouvelle preuve de création
     * @param params Paramètres pour la création de la preuve
     * @returns La preuve créée
     */
    createProof(params: ProofCreationParams): Promise<CreationProof>;
    /**
     * Enregistre une preuve sur la blockchain Solana
     * @param proof Preuve à enregistrer
     * @returns Preuve mise à jour avec les informations de transaction
     */
    storeProofOnChain(proof: CreationProof): Promise<CreationProof>;
    /**
     * Marque une preuve comme payée et la traite
     * @param proofId ID de la preuve
     * @returns Preuve mise à jour
     */
    payForProof(proofId: string): Promise<CreationProof>;
    /**
     * Récupère une preuve par ID
     * @param proofId ID de la preuve
     * @returns Preuve si trouvée, sinon undefined
     */
    getProofById(proofId: string): CreationProof | undefined;
    /**
     * Récupère toutes les preuves pour une piste
     * @param trackId ID de la piste
     * @returns Liste des preuves pour cette piste
     */
    getProofsByTrackId(trackId: string): CreationProof[];
    /**
     * Récupère toutes les preuves créées par un artiste
     * @param artistId ID de l'artiste
     * @returns Liste des preuves créées par cet artiste
     */
    getProofsByArtistId(artistId: string): CreationProof[];
    /**
     * Vérifie une preuve de création
     * @param trackId ID de la piste
     * @param audioBuffer Contenu du fichier audio
     * @returns Résultat de la vérification
     */
    verifyTrack(trackId: string, audioBuffer: Buffer): Promise<ProofVerificationResult>;
    /**
     * Génère un fichier JSON de preuve pour téléchargement
     * @param proofId ID de la preuve
     * @returns Données JSON formatées
     */
    generateProofJson(proofId: string): ProofJson | null;
}
