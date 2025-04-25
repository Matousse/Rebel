import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { IDL } from './idl';
import idl from '../../../../programs/timestamp_proof/timestamp_proof.json';
import { ProofOfCreationAccount, TimestampProof } from './types';
import { SOLANA_CONFIG } from '../../account-abstraction/config';

// Adresse du programme après déploiement
const PROGRAM_ID = new PublicKey('Gk5KLraA6vHgKGPSkDmBhagMtE7Yn8xqzv99nee6F22R');

/**
 * Client pour interagir avec le programme Anchor timestamp_proof
 */
export class TimestampProofClient {
  private connection: Connection;
  private program: Program;
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
    
    // Initialiser le programme
    this.program = new Program(
        IDL as unknown as anchor.Idl,
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
      
      // Récupérer le compte
      const proofAccount = await this.program.account.proofOfCreation.fetch(
        proofPDA
      ) as ProofOfCreationAccount;
      
      return {
        artist: proofAccount.artist.toString(),
        trackHash: new Uint8Array(proofAccount.trackHash),
        timestamp: proofAccount.timestamp.toNumber(),
        pdaAddress: proofPDA.toString()
      };
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