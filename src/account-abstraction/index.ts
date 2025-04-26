// src/account-abstraction/index.ts
// Point d'entrée du module Account Abstraction
import { AccountService } from './services/account-service';
import { MagicAuthService } from './services/magic-auth-service';
import { SolanaService } from './services/solana-service';
import { ProofService } from './services/proof-service'; // Import du nouveau service
import { validateConfig } from './config';
import { UserAccount, Transaction } from './interfaces/types';

// Valider la configuration au démarrage
validateConfig();

// Exporter les interfaces
export { UserAccount, Transaction };
export type { TransactionType, TransactionStatus } from './interfaces/types';

// Exporter les services
export { AccountService, MagicAuthService, SolanaService, ProofService };

// Instance singleton pour utilisation globale
const solanaService = new SolanaService();
const accountService = new AccountService();
const proofService = new ProofService(solanaService);

export { accountService, proofService };