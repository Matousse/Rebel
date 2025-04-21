import { 
    Connection, 
    Keypair, 
    PublicKey, 
    Transaction, 
    sendAndConfirmTransaction,
    SystemProgram,
    LAMPORTS_PER_SOL
  } from '@solana/web3.js';
  import { SOLANA_CONFIG, getAdminKeypair } from '../config';
  import { Transaction as AppTransaction } from '../interfaces/types';
  import { v4 as uuidv4 } from 'uuid';
  
  /**
   * Service pour interagir avec la blockchain Solana
   * Gère les aspects de bas niveau de l'interaction avec Solana
   */
  export class SolanaService {
    private connection: Connection;
    private adminKeypair: Keypair;
    
    constructor() {
      // Initialiser la connexion au réseau Solana
      this.connection = new Connection(SOLANA_CONFIG.endpoint, 'confirmed');
      
      // Charger le keypair admin pour l'account abstraction
      this.adminKeypair = getAdminKeypair();
      
      console.log(`Solana service initialisé sur ${SOLANA_CONFIG.network}`);
      console.log(`Admin wallet: ${this.adminKeypair.publicKey.toString()}`);
    }
    
    /**
     * Récupérer la connexion Solana
     */
    getConnection(): Connection {
      return this.connection;
    }
    
    /**
     * Récupérer le keypair admin
     */
    getAdminKeypair(): Keypair {
      return this.adminKeypair;
    }
    
    /**
     * Vérifier le solde SOL d'une adresse
     */
    async getSolBalance(address: string | PublicKey): Promise<number> {
      const publicKey = typeof address === 'string' ? new PublicKey(address) : address;
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL; // Convertir lamports en SOL
    }
    
    /**
     * Financer un nouveau compte utilisateur avec une petite quantité de SOL
     * Utilisé uniquement en développement/testnet pour permettre les premières transactions
     */
    async fundUserAccount(address: string | PublicKey): Promise<AppTransaction> {
      const userPublicKey = typeof address === 'string' ? new PublicKey(address) : address;
      
      try {
        // Créer la transaction pour transférer des SOL depuis le compte admin
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: this.adminKeypair.publicKey,
            toPubkey: userPublicKey,
            lamports: 0.01 * LAMPORTS_PER_SOL // 0.01 SOL suffisant pour quelques transactions
          })
        );
        
        // Envoyer et confirmer la transaction
        const signature = await sendAndConfirmTransaction(
          this.connection,
          transaction,
          [this.adminKeypair]
        );
        
        console.log(`Compte ${userPublicKey.toString()} financé avec 0.01 SOL: ${signature}`);
        
        // Retourner l'objet transaction pour notre système
        return {
          id: uuidv4(),
          userId: userPublicKey.toString(), // Temporaire, sera remplacé par l'appelant
          type: 'ACCOUNT_CREATION',
          status: 'COMPLETED',
          timestamp: Date.now(),
          signature,
          metadata: { amount: 0.01, network: SOLANA_CONFIG.network }
        };
      } catch (error) {
        console.error(`Erreur lors du financement du compte ${userPublicKey.toString()}:`, error);
        
        return {
          id: uuidv4(),
          userId: userPublicKey.toString(),
          type: 'ACCOUNT_CREATION',
          status: 'FAILED',
          timestamp: Date.now(),
          metadata: { 
            error: (error as Error).message,
            network: SOLANA_CONFIG.network
          }
        };
      }
    }
    
    /**
     * Créer et soumettre une transaction sponsorisée
     * L'admin paie les frais de gas, mais l'utilisateur peut toujours être le signataire principal
     */
    async submitSponsoredTransaction(
      transaction: Transaction,
      userSignature: Buffer,
      userPublicKey: PublicKey
    ): Promise<string> {
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
      } catch (error) {
        console.error("Erreur lors de la soumission de la transaction sponsorisée:", error);
        throw error;
      }
    }
    
    /**
     * Vérifier si une transaction existe et a été confirmée
     */
    async verifyTransaction(signature: string): Promise<boolean> {
      try {
        const { value } = await this.connection.getSignatureStatus(signature);
        return value !== null && value.confirmationStatus === 'confirmed';
      } catch (error) {
        console.error("Erreur lors de la vérification de la transaction:", error);
        return false;
      }
    }
  }