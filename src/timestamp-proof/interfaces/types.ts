// Types pour le système de preuve de création horodatée

/**
 * Métadonnées de la preuve de création
 */
export interface ProofMetadata {
    artistId: string;        // ID de l'artiste dans notre système
    artistPublicKey: string; // Clé publique Solana de l'artiste
    trackId: string;         // ID de la piste dans notre système
    title: string;           // Titre de la piste
    contentHash: string;     // Hash SHA-256 du fichier audio (hex)
    contentHashBytes: Uint8Array; // Hash en bytes pour Solana
    createdAt: number;       // Timestamp de création (ms)
  }
  
  /**
   * Statut de la preuve
   */
  export type ProofStatus = 
    | 'PENDING'    // En attente de confirmation
    | 'CONFIRMED'  // Confirmée sur la blockchain
    | 'FAILED';    // Échec de l'enregistrement
  
  /**
   * Preuve de création complète
   */
  export interface CreationProof {
    id: string;             // ID unique de la preuve dans notre système
    metadata: ProofMetadata;// Métadonnées de la preuve
    transactionId?: string; // ID de la transaction Solana
    pdaAddress?: string;    // Adresse PDA sur Solana
    status: ProofStatus;    // Statut de la preuve
    version: number;        // Version (pour les preuves multiples d'une même piste)
    isPaid: boolean;        // Si la preuve a été payée (première gratuite)
    cost: number;           // Coût en Rebellion Points
  }
  
  /**
   * Paramètres pour créer une nouvelle preuve
   */
  export interface ProofCreationParams {
    trackId: string;        // ID de la piste dans notre système
    artistId: string;       // ID de l'artiste dans notre système
    artistPublicKey: string;// Clé publique Solana de l'artiste
    title: string;          // Titre de la piste
    audioBuffer: Buffer;    // Contenu du fichier audio pour le hachage
  }
  
  /**
   * Résultat de vérification d'une preuve
   */
  export interface ProofVerificationResult {
    isValid: boolean;          // Si la preuve est valide
    originalTimestamp?: number;// Timestamp original si valide
    onChain: boolean;          // Si la preuve existe sur la blockchain
    pdaAddress?: string;       // Adresse PDA de la preuve
    details?: string;          // Détails supplémentaires
  }
  
  /**
   * Format du fichier JSON de preuve pour téléchargement
   */
  export interface ProofJson {
    artist_id: string;       // ID de l'artiste (clé publique)
    track_hash: string;      // Hash SHA-256 du fichier (hex)
    track_id: string;        // ID de la piste dans notre système
    track_title: string;     // Titre de la piste
    timestamp: {
      unix: number;          // Timestamp Unix en secondes
      iso: string;           // Format ISO 8601
    };
    nft_id: string;          // Adresse PDA de la preuve sur Solana
    transaction_id?: string; // ID de la transaction Solana
  }