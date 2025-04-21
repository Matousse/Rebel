import * as dotenv from 'dotenv';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

dotenv.config();

// Configuration Solana
export const SOLANA_CONFIG = {
  network: process.env.SOLANA_NETWORK || 'devnet',
  endpoints: {
    mainnet: process.env.SOLANA_MAINNET_URL || 'https://api.mainnet-beta.solana.com',
    devnet: process.env.SOLANA_DEVNET_URL || 'https://api.devnet.solana.com', 
    testnet: process.env.SOLANA_TESTNET_URL || 'https://api.testnet.solana.com',
    local: 'http://localhost:8899'
  },
  // Obtenir l'endpoint en fonction du réseau configuré
  get endpoint() {
    return this.endpoints[this.network as keyof typeof this.endpoints] || this.endpoints.devnet;
  }
};

// Configuration Magic.link
export const MAGIC_CONFIG = {
  publishableKey: process.env.MAGIC_PUBLISHABLE_KEY || '',
  secretKey: process.env.MAGIC_SECRET_KEY || ''
};

// Configuration de l'admin wallet pour payer les frais (account abstraction)
export const getAdminKeypair = (): Keypair => {
  const privateKeyBase58 = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKeyBase58) {
    throw new Error("ERREUR: Clé privée d'admin non définie. Définissez ADMIN_PRIVATE_KEY dans .env");
  }
  
  try {
    const secretKey = bs58.decode(privateKeyBase58);
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error(`ERREUR: Format de clé privée invalide: ${(error as Error).message}`);
  }
};

// Vérifier la configuration au démarrage
export const validateConfig = (): void => {
  const requiredEnvVars = [
    'MAGIC_PUBLISHABLE_KEY',
    'MAGIC_SECRET_KEY',
    'ADMIN_PRIVATE_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`ATTENTION: Variables d'environnement manquantes: ${missingVars.join(', ')}`);
    console.warn('Certaines fonctionnalités pourraient ne pas fonctionner correctement.');
  }
};