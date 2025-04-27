// src/timestamp-proof/services/proof-service.ts

import { SolanaService } from '../../account-abstraction/services/solana-service';
import { ProofCreationParams, CreationProof, ProofStatus, ProofVerificationResult, ProofJson } from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// Import the JavaScript client directly
const { createAnchorClient } = require('../../utils/anchorClient');

/**
 * Service principal pour la gestion des preuves de création horodatées
 */
export class ProofService {
  private solanaService: SolanaService;
  private anchorClient: any;
  private proofs: Map<string, CreationProof> = new Map();
  
  /**
   * Initialise le service avec le service Solana existant
   * @param solanaService Service Solana de l'application
   */
  constructor(solanaService: SolanaService) {
    this.solanaService = solanaService;
    
    // Initialize the Anchor client with the admin keypair
    try {
      const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
      if (adminPrivateKey) {
        this.anchorClient = createAnchorClient(
          adminPrivateKey, 
          this.solanaService.getConnection().rpcEndpoint
        );
        console.log('Anchor client initialized successfully');
      } else {
        console.error("ADMIN_PRIVATE_KEY not defined, Anchor functionality will be disabled");
      }
    } catch (error) {
      console.error("Failed to initialize Anchor client:", error);
    }
  }
  
  /**
   * Crée une nouvelle preuve de création
   * @param params Paramètres pour la création de la preuve
   * @returns La preuve créée
   */
  async createProof(params: ProofCreationParams): Promise<CreationProof> {
    const { trackId, artistId, artistPublicKey, title, audioBuffer } = params;
    
    // Générer le hash du contenu audio
    const contentHash = crypto
      .createHash('sha256')
      .update(audioBuffer)
      .digest('hex');
    
    const contentHashBytes = Buffer.from(contentHash, 'hex');
    
    // Vérifier si c'est la première preuve pour cette piste
    const existingProofs = Array.from(this.proofs.values())
      .filter(proof => proof.metadata.trackId === trackId)
      .sort((a, b) => a.version - b.version);
    
    const version = existingProofs.length + 1;
    const isFreeProof = version === 1;
    
    // Créer l'objet de preuve
    const proof: CreationProof = {
      id: `proof_${uuidv4()}`,
      metadata: {
        artistId,
        artistPublicKey,
        trackId,
        title,
        contentHash,
        contentHashBytes,
        createdAt: Date.now()
      },
      status: 'PENDING',
      cost: isFreeProof ? 0 : 10,
      isPaid: isFreeProof,
      version
    };
    
    // Enregistrer la preuve dans notre système
    this.proofs.set(proof.id, proof);
    
    // Si c'est gratuit ou déjà payé, et que l'Anchor client est disponible,
    // essayer d'enregistrer sur la blockchain
    if (proof.isPaid && this.anchorClient) {
      try {
        const result = await this.anchorClient.mintProofOfCreation(
          artistPublicKey,
          contentHash
        );
        
        if (result.success) {
          const updatedProof: CreationProof = {
            ...proof,
            status: 'CONFIRMED',
            transactionId: result.transactionId,
            pdaAddress: result.pdaAddress
          };
          
          this.proofs.set(proof.id, updatedProof);
          return updatedProof;
        }
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement blockchain:`, error);
      }
    }
    
    return proof;
  }
  
  /**
   * Enregistre une preuve sur la blockchain Solana
   * @param proof Preuve à enregistrer
   * @returns Preuve mise à jour avec les informations de transaction
   */
  async storeProofOnChain(proof: CreationProof): Promise<CreationProof> {
    if (!this.anchorClient) {
      console.error("Anchor client not initialized");
      return {
        ...proof,
        status: 'FAILED'
      };
    }
  
    try {
      const result = await this.anchorClient.mintProofOfCreation(
        proof.metadata.artistPublicKey,
        proof.metadata.contentHash
      );
      
      if (result.success) {
        const updatedProof: CreationProof = {
          ...proof,
          status: 'CONFIRMED',
          transactionId: result.transactionId,
          pdaAddress: result.pdaAddress
        };
        
        this.proofs.set(proof.id, updatedProof);
        return updatedProof;
      } else {
        throw new Error(result.error || "Unknown error during blockchain storage");
      }
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement de la preuve ${proof.id} sur la blockchain:`, error);
      
      const failedProof: CreationProof = {
        ...proof,
        status: 'FAILED'
      };
      
      this.proofs.set(proof.id, failedProof);
      return failedProof;
    }
  }
  
  /**
   * Marque une preuve comme payée et la traite
   * @param proofId ID de la preuve
   * @returns Preuve mise à jour
   */
  async payForProof(proofId: string): Promise<CreationProof> {
    const proof = this.proofs.get(proofId);
    
    if (!proof) {
      throw new Error(`Preuve ${proofId} non trouvée`);
    }
    
    if (proof.isPaid) {
      return proof; // Déjà payée
    }
    
    // Mettre à jour le statut de paiement
    const updatedProof: CreationProof = {
      ...proof,
      isPaid: true
    };
    
    this.proofs.set(proofId, updatedProof);
    
    // Enregistrer sur la blockchain
    return await this.storeProofOnChain(updatedProof);
  }
  
  /**
   * Récupère une preuve par ID
   * @param proofId ID de la preuve
   * @returns Preuve si trouvée, sinon undefined
   */
  getProofById(proofId: string): CreationProof | undefined {
    return this.proofs.get(proofId);
  }
  
  /**
   * Récupère toutes les preuves pour une piste
   * @param trackId ID de la piste
   * @returns Liste des preuves pour cette piste
   */
  getProofsByTrackId(trackId: string): CreationProof[] {
    return Array.from(this.proofs.values())
      .filter(proof => proof.metadata.trackId === trackId)
      .sort((a, b) => a.version - b.version);
  }
  
  /**
   * Récupère toutes les preuves créées par un artiste
   * @param artistId ID de l'artiste
   * @returns Liste des preuves créées par cet artiste
   */
  getProofsByArtistId(artistId: string): CreationProof[] {
    return Array.from(this.proofs.values())
      .filter(proof => proof.metadata.artistId === artistId)
      .sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);
  }
  
  /**
   * Vérifie une preuve de création
   * @param trackId ID de la piste
   * @param audioBuffer Contenu du fichier audio
   * @returns Résultat de la vérification
   */
  async verifyTrack(trackId: string, audioBuffer: Buffer): Promise<ProofVerificationResult> {
    // Trouver les preuves pour cette piste
    const proofs = this.getProofsByTrackId(trackId);
    
    if (proofs.length === 0) {
      return {
        isValid: false,
        onChain: false,
        details: 'Aucune preuve trouvée pour cette piste'
      };
    }
    
    // Utiliser la dernière preuve
    const latestProof = proofs[proofs.length - 1];
    
    // Vérifier le hash du contenu
    const contentHash = crypto
      .createHash('sha256')
      .update(audioBuffer)
      .digest('hex');
      
    const hashMatches = contentHash === latestProof.metadata.contentHash;
    
    if (!hashMatches) {
      return {
        isValid: false,
        onChain: false,
        details: 'Le hash du contenu ne correspond pas'
      };
    }
    
    // Vérifier si la preuve est sur la blockchain
    const onChain = latestProof.status === 'CONFIRMED' && !!latestProof.pdaAddress;
    
    // Vérifier la preuve sur la blockchain
    let chainVerified = false;
    if (onChain && latestProof.pdaAddress && this.anchorClient) {
      try {
        const verificationResult = await this.anchorClient.verifyFileProof(
          latestProof.metadata.artistPublicKey,
          audioBuffer
        );
        
        chainVerified = verificationResult.verified;
      } catch (error) {
        console.error('Erreur lors de la vérification sur la blockchain:', error);
      }
    }
    
    return {
      isValid: hashMatches && (onChain ? chainVerified : true),
      originalTimestamp: latestProof.metadata.createdAt,
      onChain: onChain && chainVerified,
      pdaAddress: latestProof.pdaAddress,
      details: onChain 
        ? (chainVerified 
            ? 'Preuve vérifiée sur la blockchain' 
            : 'Preuve non vérifiable sur la blockchain') 
        : 'Preuve vérifiée localement uniquement'
    };
  }
  
  /**
   * Génère un fichier JSON de preuve pour téléchargement
   * @param proofId ID de la preuve
   * @returns Données JSON formatées
   */
  generateProofJson(proofId: string): ProofJson | null {
    const proof = this.getProofById(proofId);
    
    if (!proof || proof.status !== 'CONFIRMED' || !proof.pdaAddress) {
      return null;
    }
    
    return {
      artist_id: proof.metadata.artistPublicKey,
      track_hash: proof.metadata.contentHash,
      track_id: proof.metadata.trackId,
      track_title: proof.metadata.title,
      timestamp: {
        unix: Math.floor(proof.metadata.createdAt / 1000), // Convertir ms en secondes
        iso: new Date(proof.metadata.createdAt).toISOString()
      },
      nft_id: proof.pdaAddress,
      transaction_id: proof.transactionId
    };
  }
}