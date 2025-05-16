"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class ProofService {
    constructor(solanaService) {
        this.solanaService = solanaService;
    }
    /**
     * Créer une preuve de création pour un morceau musical
     * @param trackId Identifiant du morceau
     * @param userId Identifiant de l'utilisateur
     * @param metadata Métadonnées du morceau à inclure dans la preuve
     */
    async createProofOfCreation(trackId, userId, metadata) {
        try {
            // Créer un hash des métadonnées
            const contentHash = crypto_1.default
                .createHash('sha256')
                .update(JSON.stringify({ trackId, userId, metadata, timestamp: Date.now() }))
                .digest('hex');
            // Utiliser le service createMemoTransaction pour stocker le hash sur la blockchain
            const { signature } = await this.solanaService.createMemoTransaction(this.solanaService.getAdminKeypair().publicKey, `rebellion-proof:${contentHash}`);
            // Timestamp actuel
            const timestamp = Date.now();
            return {
                success: true,
                trackId,
                timestamp,
                signature,
                transactionId: signature
            };
        }
        catch (error) {
            console.error('Error creating proof of creation:', error);
            return {
                success: false,
                trackId,
                timestamp: Date.now(),
                error: error.message
            };
        }
    }
    /**
     * Vérifie l'existence d'une preuve sur la blockchain
     * @param signature Signature de la transaction
     */
    async verifyProof(signature) {
        try {
            return await this.solanaService.verifyTransaction(signature);
        }
        catch (error) {
            console.error('Error verifying proof:', error);
            return false;
        }
    }
}
exports.ProofService = ProofService;
