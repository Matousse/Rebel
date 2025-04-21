import { SolanaService } from './solana-service';
import { MagicAuthService } from './magic-auth-service';
import { UserAccount, Transaction } from '../interfaces/types';
import { SOLANA_CONFIG } from '../config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service principal pour l'Account Abstraction
 */
export class AccountService {
  private solanaService: SolanaService;
  private magicAuthService: MagicAuthService;
  private users: Map<string, UserAccount> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  
  constructor() {
    this.solanaService = new SolanaService();
    this.magicAuthService = new MagicAuthService();
    
    console.log("Service Account Abstraction initialisé");
  }
  
  /**
   * Authentifier un utilisateur via Magic.link et créer/récupérer son compte
   */
  async authenticateUser(didToken: string, username?: string): Promise<{
    user: UserAccount;
    isNewUser: boolean;
    transaction: Transaction;
  }> {
    try {
      // Valider le token
      const isValid = await this.magicAuthService.validateToken(didToken);
      if (!isValid) {
        throw new Error("Token Magic invalide");
      }
      
      // Récupérer les métadonnées
      const metadata = await this.magicAuthService.getUserMetadata(didToken);
      
      // Vérifier si l'utilisateur existe déjà
      const existingUser = Array.from(this.users.values()).find(
        user => user.magicIssuer === metadata.issuer
      );
      
      let user: UserAccount;
      let isNewUser = false;
      
      if (existingUser) {
        // Utilisateur existant
        user = existingUser;
      } else {
        // Nouvel utilisateur
        user = await this.magicAuthService.createUserAccountFromMagic(didToken, username);
        this.users.set(user.id, user);
        isNewUser = true;
        
        // Pour les nouveaux utilisateurs sur devnet/testnet, financer leur compte
        if (['devnet', 'testnet'].includes(SOLANA_CONFIG.network)) {
          try {
            await this.solanaService.fundUserAccount(user.publicKey);
          } catch (error) {
            console.warn(`Impossible de financer le compte de ${user.username}:`, error);
            // On continue même si le financement échoue
          }
        }
      }
      
      // Enregistrer la transaction d'authentification
      const transaction: Transaction = {
        id: `tx_${uuidv4()}`,
        userId: user.id,
        type: isNewUser ? 'ACCOUNT_CREATION' : 'AUTHENTICATION',
        status: 'COMPLETED',
        timestamp: Date.now(),
        metadata: {
          email: user.email,
          network: SOLANA_CONFIG.network,
          isNewUser
        }
      };
      
      this.transactions.set(transaction.id, transaction);
      
      return { user, isNewUser, transaction };
    } catch (error) {
      console.error("Erreur lors de l'authentification:", error);
      throw error;
    }
  }
  
  /**
   * Récupérer un utilisateur par ID
   */
  getUserById(userId: string): UserAccount | undefined {
    return this.users.get(userId);
  }
  
  /**
   * Récupérer un utilisateur par email
   */
  getUserByEmail(email: string): UserAccount | undefined {
    return Array.from(this.users.values()).find(
      user => user.email === email
    );
  }
  
  /**
   * Récupérer un utilisateur par son Magic issuer
   */
  getUserByMagicIssuer(issuer: string): UserAccount | undefined {
    return Array.from(this.users.values()).find(
      user => user.magicIssuer === issuer
    );
  }
  
  /**
   * Mettre à jour les informations d'un utilisateur
   */
  updateUser(userId: string, updates: Partial<Omit<UserAccount, 'id' | 'publicKey' | 'magicIssuer'>>): UserAccount {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    
    // Appliquer les mises à jour
    const updatedUser: UserAccount = {
      ...user,
      ...updates
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  /**
   * Enregistrer la participation d'un utilisateur à un challenge
   */
  async participateInChallenge(userId: string, challengeId: string): Promise<Transaction> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    
    // Créer la transaction
    const transaction: Transaction = {
      id: `tx_${uuidv4()}`,
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
  getUserTransactions(userId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp); // Du plus récent au plus ancien
  }
  
  /**
   * Récupérer une transaction par ID
   */
  getTransactionById(transactionId: string): Transaction | undefined {
    return this.transactions.get(transactionId);
  }
  
  /**
   * Déconnecter un utilisateur
   */
  async logoutUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.magicIssuer) {
      return false;
    }
    
    try {
      return await this.magicAuthService.logoutUser(user.magicIssuer);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      return false;
    }
  }
  
  /**
   * Récupérer le solde SOL d'un utilisateur
   */
  async getUserSolBalance(userId: string): Promise<number> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    
    return await this.solanaService.getSolBalance(user.publicKey);
  }
}