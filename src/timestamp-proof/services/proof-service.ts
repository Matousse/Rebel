import { v4 as uuidv4 } from 'uuid';
import { Keypair, PublicKey } from '@solana/web3.js';
import { 
  ProofCreationParams, 
  CreationProof, 
  ProofStatus,
  ProofVerificationResult,
  ProofJson
} from '../interfaces/types';
import { HashService } from './hash-service';
import { SolanaService } from '../../account-abstraction/services/solana-service';
import { TimestampProofClient } from '../anchor/client';

/**
 * Service principal pour la gestion des preuves de création horodatées
 */
export class ProofService {
  private solanaService: SolanaService;
  private proofClient: TimestampProofClient;
  private proofs: Map<string, CreationProof> = new Map();
  
  /**
   * Initialise le service avec le service Solana existant
   * @param solanaService Service Solana de l'application
   */
  constructor(solanaService: SolanaService) {
    this.solanaService = solanaService;
    
    // Initialiser le client Anchor avec le keypair admin
    const adminKeypair = this.solanaService.getAdminKeypair();
    this.proofClient = new TimestampProofClient(adminKeypair);
  }
  
  /**
   * Crée une nouvelle preuve de création
   * @param params Paramètres pour la création de la preuve
   * @returns La preuve créée
   */
  async createProof(params: ProofCreationParams): Promise<CreationProof> {
    const { trackId, artistId, artistPublicKey, title, audioBuffer } = params;
    
    // Générer le hash du contenu audio
    const contentHash = HashService.generateContentHash(audioBuffer);
    const contentHashBytes = HashService.hexToBytes(contentHash);
    
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
      cost: isFreeProof ? 0 : 10, // 10 Rebellion Points pour les preuves suivantes
      isPaid: isFreeProof, // La première preuve est automatiquement considérée comme payée
      version
    };
    
    // Enregistrer la preuve dans notre système
    this.proofs.set(proof.id, proof);
    
    // Si c'est gratuit ou déjà payé, enregistrer sur la blockchain
    if (proof.isPaid) {
      await this.storeProofOnChain(proof);
    }
    
    return proof;
  }
  
  /**
   * Enregistre une preuve sur la blockchain Solana
   * @param proof Preuve à enregistrer
   * @returns Preuve mise à jour avec les informations de transaction
   */
  async storeProofOnChain(proof: CreationProof): Promise<CreationProof> {
    try {
      // Créer un keypair temporaire pour l'artiste
      // Dans une implémentation réelle, l'artiste devrait signer lui-même
      // via une wallet connectée au frontend
      const artistKeypair = Keypair.fromSecretKey(
        new Uint8Array(Buffer.from(this.solanaService.getAdminKeypair().secretKey))
      );
      
      // Convertir la clé publique de l'artiste de string à PublicKey
      const artistPublicKey = new PublicKey(proof.metadata.artistPublicKey);
      
      // Vérifier si la preuve existe déjà sur la blockchain
      const [pdaAddress, _] = await this.proofClient.deriveProofPDA(
        artistPublicKey,
        proof.metadata.contentHashBytes
      );
      
      const exists = await this.proofClient.proofExists(
        artistPublicKey,
        proof.metadata.contentHashBytes
      );
      
      if (exists) {
        // La preuve existe déjà, simplement mettre à jour notre état local
        const updatedProof: CreationProof = {
          ...proof,
          status: 'CONFIRMED',
          pdaAddress: pdaAddress.toString()
        };
        
        this.proofs.set(proof.id, updatedProof);
        return updatedProof;
      }
      
      // Créer la preuve sur la blockchain
      const txSignature = await this.proofClient.mintProofOfCreation(
        artistKeypair,
        proof.metadata.contentHashBytes
      );
      
      // Mettre à jour la preuve avec les informations de transaction
      const updatedProof: CreationProof = {
        ...proof,
        status: 'CONFIRMED',
        transactionId: txSignature,
        pdaAddress: pdaAddress.toString()
      };
      
      this.proofs.set(proof.id, updatedProof);
      return updatedProof;
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement de la preuve ${proof.id} sur la blockchain:`, error);
      
      // Mettre à jour la preuve comme échouée
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
    const contentHash = HashService.generateContentHash(audioBuffer);
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
    if (onChain && latestProof.pdaAddress) {
      try {
        const artistPublicKey = new PublicKey(latestProof.metadata.artistPublicKey);
        const proofData = await this.proofClient.getProofOfCreation(
          artistPublicKey,
          latestProof.metadata.contentHashBytes
        );
        
        chainVerified = proofData !== null;
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