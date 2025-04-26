// src/account-abstraction/services/proof-service.ts
import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { SolanaService } from './solana-service';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface ProofCreationResult {
  success: boolean;
  trackId: string;
  timestamp: number;
  signature?: string;
  transactionId?: string;
  error?: string;
}

export class ProofService {
  private solanaService: SolanaService;

  constructor(solanaService: SolanaService) {
    this.solanaService = solanaService;
  }

  /**
   * Créer une preuve de création pour un morceau musical
   * @param trackId Identifiant du morceau
   * @param userId Identifiant de l'utilisateur
   * @param metadata Métadonnées du morceau à inclure dans la preuve
   */
  async createProofOfCreation(
    trackId: string,
    userId: string,
    metadata: Record<string, any>
  ): Promise<ProofCreationResult> {
    try {
      // Créer un hash des métadonnées
      const contentHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ trackId, userId, metadata, timestamp: Date.now() }))
        .digest('hex');
      
      // Utiliser le service createMemoTransaction pour stocker le hash sur la blockchain
      const { signature } = await this.solanaService.createMemoTransaction(
        this.solanaService.getAdminKeypair().publicKey,
        `rebellion-proof:${contentHash}`
      );
      
      // Timestamp actuel
      const timestamp = Date.now();
      
      return {
        success: true,
        trackId,
        timestamp,
        signature,
        transactionId: signature
      };
    } catch (error) {
      console.error('Error creating proof of creation:', error);
      return {
        success: false,
        trackId,
        timestamp: Date.now(),
        error: (error as Error).message
      };
    }
  }

  /**
   * Vérifie l'existence d'une preuve sur la blockchain
   * @param signature Signature de la transaction
   */
  async verifyProof(signature: string): Promise<boolean> {
    try {
      return await this.solanaService.verifyTransaction(signature);
    } catch (error) {
      console.error('Error verifying proof:', error);
      return false;
    }
  }
}