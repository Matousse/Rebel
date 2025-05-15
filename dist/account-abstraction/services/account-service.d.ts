import { UserAccount, Transaction } from '../interfaces/types';
/**
 * Service principal pour l'Account Abstraction
 */
export declare class AccountService {
    private solanaService;
    private magicAuthService;
    private users;
    private transactions;
    constructor();
    /**
     * Authentifier un utilisateur via Magic.link et créer/récupérer son compte
     */
    authenticateUser(didToken: string, username?: string): Promise<{
        user: UserAccount;
        isNewUser: boolean;
        transaction: Transaction;
    }>;
    /**
     * Récupérer un utilisateur par ID
     */
    getUserById(userId: string): UserAccount | undefined;
    /**
     * Récupérer un utilisateur par email
     */
    getUserByEmail(email: string): UserAccount | undefined;
    /**
     * Récupérer un utilisateur par son Magic issuer
     */
    getUserByMagicIssuer(issuer: string): UserAccount | undefined;
    /**
     * Mettre à jour les informations d'un utilisateur
     */
    updateUser(userId: string, updates: Partial<Omit<UserAccount, 'id' | 'publicKey' | 'magicIssuer'>>): UserAccount;
    /**
     * Enregistrer la participation d'un utilisateur à un challenge
     */
    participateInChallenge(userId: string, challengeId: string): Promise<Transaction>;
    /**
     * Récupérer l'historique des transactions d'un utilisateur
     */
    getUserTransactions(userId: string): Transaction[];
    /**
     * Récupérer une transaction par ID
     */
    getTransactionById(transactionId: string): Transaction | undefined;
    /**
     * Déconnecter un utilisateur
     */
    logoutUser(userId: string): Promise<boolean>;
    /**
   * Créer une preuve de création pour un morceau de musique
   */
    createProofOfCreation(userId: string, trackMetadata: {
        trackId: string;
        title: string;
        hash: string;
    }): Promise<Transaction>;
    /**
     * Vérifier une preuve de création
     */
    verifyProofOfCreation(signature: string): Promise<boolean>;
    /**
     * Récupérer le solde SOL d'un utilisateur
     */
    getUserSolBalance(userId: string): Promise<number>;
}
