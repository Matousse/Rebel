import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction
} from '@solana/web3.js';
import { SOLANA_CONFIG, getAdminKeypair } from '../config';
import { v4 as uuidv4 } from 'uuid';

// Définir le type Transaction localement pour éviter l'importation circulaire
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
export class SolanaService {
  private connection: Connection;
  private adminKeypair: Keypair;
  
  constructor() {
    // Initialiser la connexion au réseau Solana
    this.connection = new Connection(SOLANA_CONFIG.endpoint, 'confirmed');
    
    // Charger le keypair admin
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
      
      // Retourner l'objet transaction
      return {
        id: uuidv4(),
        userId: userPublicKey.toString(),
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

  /**
 * Créer une transaction mémo pour stocker des données sur la blockchain
 */
async createMemoTransaction(
  address: string | PublicKey,
  memoText: string
): Promise<{ signature: string }> {
  try {
    const publicKey = typeof address === 'string' ? new PublicKey(address) : address;
    
    // Importer directement les fonctions et constantes nécessaires
    const MemoModule = await import('@solana/spl-memo');
    
    // Créer l'instruction de mémo
    const instruction = new TransactionInstruction({
      keys: [{ pubkey: publicKey, isSigner: false, isWritable: false }],
      programId: MemoModule.MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, 'utf8')
    });
    
    // Créer la transaction
    const transaction = new Transaction().add(instruction);
    
    // Configurer la transaction
    transaction.feePayer = this.adminKeypair.publicKey;
    const { blockhash } = await this.connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    
    // Signer et envoyer la transaction
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.adminKeypair]
    );
    
    return { signature };
  } catch (error) {
    console.error("Erreur lors de la création de la transaction mémo:", error);
    throw error;
  }
}}