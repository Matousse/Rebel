// Types partagés pour l'Account Abstraction

export interface UserAccount {
    id: string;         // ID utilisateur dans notre système
    username: string;   // Nom d'utilisateur (optionnel, peut être dérivé de l'email)
    publicKey: string;  // Adresse Solana de l'utilisateur
    magicIssuer?: string; // Magic.link issuer ID (identifiant unique)
    email?: string;     // Email de l'utilisateur (si disponible via Magic)
    createdAt: number;  // Timestamp de création
  }
  
  // Types d'actions pouvant être réalisées via l'AA
  export type TransactionType = 
    | 'ACCOUNT_CREATION'   // Création du compte utilisateur
    | 'AUTHENTICATION'     // Connexion de l'utilisateur
    | 'CHALLENGE_PARTICIPATION'; // Participation à un challenge
  
  // Statuts des transactions
  export type TransactionStatus = 
    | 'PENDING'    // En attente de confirmation 
    | 'COMPLETED'  // Confirmée
    | 'FAILED';    // Échouée
  
  // Représentation d'une transaction dans notre système
  export interface Transaction {
    id: string;             // ID interne de la transaction
    userId: string;         // ID de l'utilisateur associé
    type: TransactionType;  // Type de transaction
    status: TransactionStatus; // Statut
    timestamp: number;      // Date/heure
    signature?: string;     // Signature Solana (si applicable)
    metadata?: Record<string, any>; // Données supplémentaires
  }