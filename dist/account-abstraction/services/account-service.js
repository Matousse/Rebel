"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const solana_service_1 = require("./solana-service");
const magic_auth_service_1 = require("./magic-auth-service");
const config_1 = require("../config");
const uuid_1 = require("uuid");
/**
 * Service principal pour l'Account Abstraction
 */
class AccountService {
    constructor() {
        this.users = new Map();
        this.transactions = new Map();
        this.solanaService = new solana_service_1.SolanaService();
        this.magicAuthService = new magic_auth_service_1.MagicAuthService();
        console.log("Service Account Abstraction initialisé");
    }
    /**
     * Authentifier un utilisateur via Magic.link et créer/récupérer son compte
     */
    async authenticateUser(didToken, username) {
        try {
            // Valider le token
            const isValid = await this.magicAuthService.validateToken(didToken);
            if (!isValid) {
                throw new Error("Token Magic invalide");
            }
            // Récupérer les métadonnées
            const metadata = await this.magicAuthService.getUserMetadata(didToken);
            // Vérifier si l'utilisateur existe déjà
            const existingUser = Array.from(this.users.values()).find(user => user.magicIssuer === metadata.issuer);
            let user;
            let isNewUser = false;
            if (existingUser) {
                // Utilisateur existant
                user = existingUser;
            }
            else {
                // Nouvel utilisateur
                user = await this.magicAuthService.createUserAccountFromMagic(didToken, username);
                this.users.set(user.id, user);
                isNewUser = true;
                // Pour les nouveaux utilisateurs sur devnet/testnet, financer leur compte
                if (['devnet', 'testnet'].includes(config_1.SOLANA_CONFIG.network)) {
                    try {
                        await this.solanaService.fundUserAccount(user.publicKey);
                    }
                    catch (error) {
                        console.warn(`Impossible de financer le compte de ${user.username}:`, error);
                        // On continue même si le financement échoue
                    }
                }
            }
            // Enregistrer la transaction d'authentification
            const transaction = {
                id: `tx_${(0, uuid_1.v4)()}`,
                userId: user.id,
                type: isNewUser ? 'ACCOUNT_CREATION' : 'AUTHENTICATION',
                status: 'COMPLETED',
                timestamp: Date.now(),
                metadata: {
                    email: user.email,
                    network: config_1.SOLANA_CONFIG.network,
                    isNewUser
                }
            };
            this.transactions.set(transaction.id, transaction);
            return { user, isNewUser, transaction };
        }
        catch (error) {
            console.error("Erreur lors de l'authentification:", error);
            throw error;
        }
    }
    /**
     * Récupérer un utilisateur par ID
     */
    getUserById(userId) {
        return this.users.get(userId);
    }
    /**
     * Récupérer un utilisateur par email
     */
    getUserByEmail(email) {
        return Array.from(this.users.values()).find(user => user.email === email);
    }
    /**
     * Récupérer un utilisateur par son Magic issuer
     */
    getUserByMagicIssuer(issuer) {
        return Array.from(this.users.values()).find(user => user.magicIssuer === issuer);
    }
    /**
     * Mettre à jour les informations d'un utilisateur
     */
    updateUser(userId, updates) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        // Appliquer les mises à jour
        const updatedUser = {
            ...user,
            ...updates
        };
        this.users.set(userId, updatedUser);
        return updatedUser;
    }
    /**
     * Enregistrer la participation d'un utilisateur à un challenge
     */
    async participateInChallenge(userId, challengeId) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        // Créer la transaction
        const transaction = {
            id: `tx_${(0, uuid_1.v4)()}`,
            userId,
            type: 'CHALLENGE_PARTICIPATION',
            status: 'COMPLETED',
            timestamp: Date.now(),
            metadata: { challengeId }
        };
        this.transactions.set(transaction.id, transaction);
        return transaction;
    }
    /**
     * Récupérer l'historique des transactions d'un utilisateur
     */
    getUserTransactions(userId) {
        return Array.from(this.transactions.values())
            .filter(tx => tx.userId === userId)
            .sort((a, b) => b.timestamp - a.timestamp); // Du plus récent au plus ancien
    }
    /**
     * Récupérer une transaction par ID
     */
    getTransactionById(transactionId) {
        return this.transactions.get(transactionId);
    }
    /**
     * Déconnecter un utilisateur
     */
    async logoutUser(userId) {
        const user = this.users.get(userId);
        if (!user || !user.magicIssuer) {
            return false;
        }
        try {
            return await this.magicAuthService.logoutUser(user.magicIssuer);
        }
        catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            return false;
        }
    }
    /**
   * Créer une preuve de création pour un morceau de musique
   */
    async createProofOfCreation(userId, trackMetadata) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        try {
            // Préparer les métadonnées à stocker
            const memoData = JSON.stringify({
                type: "proof_of_creation",
                track_id: trackMetadata.trackId,
                title: trackMetadata.title,
                hash: trackMetadata.hash,
                timestamp: Date.now()
            });
            // Créer la transaction mémo
            const memoResult = await this.solanaService.createMemoTransaction(user.publicKey, memoData);
            // Enregistrer la transaction
            const transaction = {
                id: `tx_${(0, uuid_1.v4)()}`,
                userId,
                type: 'CHALLENGE_PARTICIPATION', // Utilisez un type approprié ou ajoutez 'PROOF_OF_CREATION'
                status: 'COMPLETED',
                timestamp: Date.now(),
                signature: memoResult.signature,
                metadata: {
                    trackId: trackMetadata.trackId,
                    title: trackMetadata.title,
                    hash: trackMetadata.hash,
                    network: config_1.SOLANA_CONFIG.network
                }
            };
            this.transactions.set(transaction.id, transaction);
            return transaction;
        }
        catch (error) {
            console.error("Erreur lors de la création de la preuve de création:", error);
            throw error;
        }
    }
    /**
     * Vérifier une preuve de création
     */
    async verifyProofOfCreation(signature) {
        try {
            return await this.solanaService.verifyTransaction(signature);
        }
        catch (error) {
            console.error("Erreur lors de la vérification de la preuve:", error);
            return false;
        }
    }
    /**
     * Récupérer le solde SOL d'un utilisateur
     */
    async getUserSolBalance(userId) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        return await this.solanaService.getSolBalance(user.publicKey);
    }
}
exports.AccountService = AccountService;
