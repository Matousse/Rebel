import { AccountService } from './services/account-service';
import { MagicAuthService } from './services/magic-auth-service';
import { SolanaService } from './services/solana-service';
import { UserAccount, Transaction } from './interfaces/types';
export { UserAccount, Transaction };
export type { TransactionType, TransactionStatus } from './interfaces/types';
export { AccountService, MagicAuthService, SolanaService };
declare const accountService: AccountService;
export { accountService };
