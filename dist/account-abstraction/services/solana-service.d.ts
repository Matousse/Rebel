import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
interface AppTransaction {
    id: string;
    userId: string;
    type: 'ACCOUNT_CREATION' | 'AUTHENTICATION' | 'CHALLENGE_PARTICIPATION';
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    timestamp: number;
    signature?: string;
    metadata?: Record<string, any>;
}
/**
 * Service pour interagir avec la blockchain Solana
 */
export declare class SolanaService {
    private connection;
    private adminKeypair;
    constructor();
    /**
     * Récupérer la connexion Solana
     */
    getConnection(): Connection;
    /**
     * Récupérer le keypair admin
     */
    getAdminKeypair(): Keypair;
    /**
     * Vérifier le solde SOL d'une adresse
     */
    getSolBalance(address: string | PublicKey): Promise<number>;
    /**
     * Financer un nouveau compte utilisateur avec une petite quantité de SOL
     */
    fundUserAccount(address: string | PublicKey): Promise<AppTransaction>;
    /**
     * Créer et soumettre une transaction sponsorisée
     */
    submitSponsoredTransaction(transaction: Transaction, userSignature: Buffer, userPublicKey: PublicKey): Promise<string>;
    /**
     * Vérifier si une transaction existe et a été confirmée
     */
    verifyTransaction(signature: string): Promise<boolean>;
    /**
   * Créer une transaction mémo pour stocker des données sur la blockchain
   */
    createMemoTransaction(address: string | PublicKey, memoText: string): Promise<{
        signature: string;
    }>;
}
export {};
