import { Keypair } from '@solana/web3.js';
export declare const SOLANA_CONFIG: {
    network: string;
    endpoints: {
        mainnet: string;
        devnet: string;
        testnet: string;
        local: string;
    };
    readonly endpoint: string;
};
export declare const MAGIC_CONFIG: {
    publishableKey: string;
    secretKey: string;
};
export declare const getAdminKeypair: () => Keypair;
export declare const validateConfig: () => void;
