import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { IDL } from './idl';
import { ProofOfCreationAccount, TimestampProof } from './types';
import { SOLANA_CONFIG } from '../../account-abstraction/config';

// Adresse du programme après déploiement
const PROGRAM_ID = new PublicKey('8Hh439HNMKGRTD1gmnifrJ2RrP6y8PsKwHRRQyponubt');

/**
 * Client pour interagir avec le programme Anchor timestamp_proof
 */
export class TimestampProofClient {
  private connection: Connection;
  private program: anchor.Program<TimestampProof>;
  private provider: anchor.AnchorProvider;

  /**
   * Initialise le client avec un keypair pour payer les transactions
   * @param payerKeypair Keypair pour payer les frais de transaction
   */
  constructor(payerKeypair: Keypair) {
    // Créer la connexion Solana
    this.connection = new Connection(SOLANA_CONFIG.endpoint, 'confirmed');
    
    // Créer le wallet pour Anchor
    const wallet = new anchor.Wallet(payerKeypair);
    
    // Créer le provider Anchor
    this.provider = new anchor.AnchorProvider(
      this.connection,
      wallet,
      { commitment: 'confirmed', preflightCommitment: 'confirmed' }
    );
    
    // Use anchor.workspace approach which handles IDL types better
    // This needs proper type casting for TypeScript to understand the structure
    this.program = new anchor.Program<TimestampProof>(
      IDL as any,
      PROGRAM_ID,
      this.provider
    );
    
    console.log('TimestampProofClient initialisé sur', SOLANA_CONFIG.network);
  }

  /**
   * Dérive l'adresse PDA pour une preuve de création
   * @param artistPublicKey Clé publique de l'artiste
   * @param trackHash Hash du track en bytes
   * @returns Adresse PDA et bump
   */
  async deriveProofPDA(artistPublicKey: PublicKey, trackHash: Uint8Array): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddressSync(
      [
        Buffer.from('proof-of-creation'),
        artistPublicKey.toBuffer(),
        Buffer.from(trackHash)
      ],
      PROGRAM_ID
    );
  }

  /**
   * Crée une nouvelle preuve de création
   * @param artistKeypair Keypair de l'artiste (pour signer)
   * @param trackHash Hash du fichier audio en Uint8Array
   * @returns Signature de la transaction
   */
  async mintProofOfCreation(
    artistKeypair: Keypair,
    trackHash: Uint8Array
  ): Promise<string> {
    try {
      // Dériver l'adresse PDA
      const [proofPDA, _] = await this.deriveProofPDA(
        artistKeypair.publicKey,
        trackHash
      );
      
      // Créer et envoyer la transaction
      const tx = await this.program.methods
        .mintProofOfCreation(Array.from(trackHash))
        .accounts({
          artist: artistKeypair.publicKey,
          payer: this.provider.wallet.publicKey, // Le wallet du client paie
          proofOfCreation: proofPDA,
          systemProgram: anchor.web3.SystemProgram.programId
        })
        .signers([artistKeypair]) // L'artiste doit signer
        .rpc();
      
      console.log(`Preuve de création créée: ${tx}`);
      return tx;
    } catch (error) {
      console.error('Erreur lors de la création de la preuve:', error);
      throw error;
    }
  }

  /**
   * Récupère les informations d'une preuve de création
   * @param artistPublicKey Clé publique de l'artiste
   * @param trackHash Hash du fichier audio en Uint8Array
   * @returns Données de la preuve de création ou null si non trouvée
   */
  async getProofOfCreation(
    artistPublicKey: PublicKey,
    trackHash: Uint8Array
  ): Promise<{
    artist: string;
    trackHash: Uint8Array;
    timestamp: number;
    pdaAddress: string;
  } | null> {
    try {
      // Dériver l'adresse PDA
      const [proofPDA, _] = await this.deriveProofPDA(
        artistPublicKey,
        trackHash
      );
      
      // First check if account exists
      const accountInfo = await this.connection.getAccountInfo(proofPDA);
      if (!accountInfo) {
        return null;
      }
      
      // Use direct coder approach to avoid TypeScript issues
      const coder = new anchor.BorshAccountsCoder(IDL as any);
      try {
        const decoded = coder.decode(
          'ProofOfCreation', // The account name from your IDL
          accountInfo.data
        );
        
        return {
          artist: decoded.artist.toString(),
          trackHash: new Uint8Array(decoded.trackHash),
          timestamp: decoded.timestamp.toNumber(),
          pdaAddress: proofPDA.toString()
        };
      } catch (decodeError) {
        console.error('Failed to decode account:', decodeError);
        return null;
      }
    } catch (error) {
      // Si le compte n'existe pas, renvoyer null
      console.log('Preuve non trouvée ou erreur:', error);
      return null;
    }
  }

  /**
   * Vérifie si une preuve de création existe
   * @param artistPublicKey Clé publique de l'artiste
   * @param trackHash Hash du fichier audio
   * @returns true si la preuve existe, false sinon
   */
  async proofExists(
    artistPublicKey: PublicKey,
    trackHash: Uint8Array
  ): Promise<boolean> {
    try {
      const proof = await this.getProofOfCreation(
        artistPublicKey,
        trackHash
      );
      
      return proof !== null;
    } catch (error) {
      return false;
    }
  }
}