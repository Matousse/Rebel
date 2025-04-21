// Point d'entrée du module Account Abstraction
import { AccountService } from './services/account-service';
import { MagicAuthService } from './services/magic-auth-service';
import { SolanaService } from './services/solana-service';
import { validateConfig } from './config';
import { UserAccount, Transaction } from './interfaces/types';

// Valider la configuration au démarrage
validateConfig();

// Exporter les interfaces
export { UserAccount, Transaction };
export type { TransactionType, TransactionStatus } from './interfaces/types';

// Exporter les services
export { AccountService, MagicAuthService, SolanaService };

// Instance singleton pour utilisation globale
const accountService = new AccountService();
export { accountService };