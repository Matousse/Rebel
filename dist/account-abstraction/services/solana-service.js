"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaService = void 0;
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const uuid_1 = require("uuid");
/**
 * Service pour interagir avec la blockchain Solana
 */
class SolanaService {
    constructor() {
        // Initialiser la connexion au réseau Solana
        this.connection = new web3_js_1.Connection(config_1.SOLANA_CONFIG.endpoint, 'confirmed');
        // Charger le keypair admin
        this.adminKeypair = (0, config_1.getAdminKeypair)();
        console.log(`Solana service initialisé sur ${config_1.SOLANA_CONFIG.network}`);
        console.log(`Admin wallet: ${this.adminKeypair.publicKey.toString()}`);
    }
    /**
     * Récupérer la connexion Solana
     */
    getConnection() {
        return this.connection;
    }
    /**
     * Récupérer le keypair admin
     */
    getAdminKeypair() {
        return this.adminKeypair;
    }
    /**
     * Vérifier le solde SOL d'une adresse
     */
    async getSolBalance(address) {
        const publicKey = typeof address === 'string' ? new web3_js_1.PublicKey(address) : address;
        const balance = await this.connection.getBalance(publicKey);
        return balance / web3_js_1.LAMPORTS_PER_SOL; // Convertir lamports en SOL
    }
    /**
     * Financer un nouveau compte utilisateur avec une petite quantité de SOL
     */
    async fundUserAccount(address) {
        const userPublicKey = typeof address === 'string' ? new web3_js_1.PublicKey(address) : address;
        try {
            // Créer la transaction pour transférer des SOL depuis le compte admin
            const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
                fromPubkey: this.adminKeypair.publicKey,
                toPubkey: userPublicKey,
                lamports: 0.01 * web3_js_1.LAMPORTS_PER_SOL // 0.01 SOL suffisant pour quelques transactions
            }));
            // Envoyer et confirmer la transaction
            const signature = await (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, [this.adminKeypair]);
            console.log(`Compte ${userPublicKey.toString()} financé avec 0.01 SOL: ${signature}`);
            // Retourner l'objet transaction
            return {
                id: (0, uuid_1.v4)(),
                userId: userPublicKey.toString(),
                type: 'ACCOUNT_CREATION',
                status: 'COMPLETED',
                timestamp: Date.now(),
                signature,
                metadata: { amount: 0.01, network: config_1.SOLANA_CONFIG.network }
            };
        }
        catch (error) {
            console.error(`Erreur lors du financement du compte ${userPublicKey.toString()}:`, error);
            return {
                id: (0, uuid_1.v4)(),
                userId: userPublicKey.toString(),
                type: 'ACCOUNT_CREATION',
                status: 'FAILED',
                timestamp: Date.now(),
                metadata: {
                    error: error.message,
                    network: config_1.SOLANA_CONFIG.network
                }
            };
        }
    }
    /**
     * Créer et soumettre une transaction sponsorisée
     */
    async submitSponsoredTransaction(transaction, userSignature, userPublicKey) {
        try {
            // Ajouter les informations nécessaires à la transaction
            transaction.feePayer = this.adminKeypair.publicKey;
            const { blockhash } = await this.connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            // Ajouter la signature de l'utilisateur
            transaction.addSignature(userPublicKey, userSignature);
            // L'admin signe la transaction (pour payer les frais)
            transaction.sign(this.adminKeypair);
            // Envoyer la transaction
            const signature = await this.connection.sendRawTransaction(transaction.serialize());
            // Attendre la confirmation
            await this.connection.confirmTransaction(signature);
            return signature;
        }
        catch (error) {
            console.error("Erreur lors de la soumission de la transaction sponsorisée:", error);
            throw error;
        }
    }
    /**
     * Vérifier si une transaction existe et a été confirmée
     */
    async verifyTransaction(signature) {
        try {
            const { value } = await this.connection.getSignatureStatus(signature);
            return value !== null && value.confirmationStatus === 'confirmed';
        }
        catch (error) {
            console.error("Erreur lors de la vérification de la transaction:", error);
            return false;
        }
    }
    /**
   * Créer une transaction mémo pour stocker des données sur la blockchain
   */
    async createMemoTransaction(address, memoText) {
        try {
            const publicKey = typeof address === 'string' ? new web3_js_1.PublicKey(address) : address;
            // Importer directement les fonctions et constantes nécessaires
            const MemoModule = await Promise.resolve().then(() => __importStar(require('@solana/spl-memo')));
            // Créer l'instruction de mémo
            const instruction = new web3_js_1.TransactionInstruction({
                keys: [{ pubkey: publicKey, isSigner: false, isWritable: false }],
                programId: MemoModule.MEMO_PROGRAM_ID,
                data: Buffer.from(memoText, 'utf8')
            });
            // Créer la transaction
            const transaction = new web3_js_1.Transaction().add(instruction);
            // Configurer la transaction
            transaction.feePayer = this.adminKeypair.publicKey;
            const { blockhash } = await this.connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            // Signer et envoyer la transaction
            const signature = await (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, [this.adminKeypair]);
            return { signature };
        }
        catch (error) {
            console.error("Erreur lors de la création de la transaction mémo:", error);
            throw error;
        }
    }
}
exports.SolanaService = SolanaService;
