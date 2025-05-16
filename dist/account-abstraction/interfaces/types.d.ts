export interface UserAccount {
    id: string;
    username: string;
    publicKey: string;
    magicIssuer?: string;
    email?: string;
    createdAt: number;
}
export type TransactionType = 'ACCOUNT_CREATION' | 'AUTHENTICATION' | 'CHALLENGE_PARTICIPATION';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export interface Transaction {
    id: string;
    userId: string;
    type: TransactionType;
    status: TransactionStatus;
    timestamp: number;
    signature?: string;
    metadata?: Record<string, any>;
}
