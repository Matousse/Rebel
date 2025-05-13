"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = exports.getAdminKeypair = exports.MAGIC_CONFIG = exports.SOLANA_CONFIG = void 0;
const dotenv = __importStar(require("dotenv"));
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
dotenv.config();
// Configuration Solana
exports.SOLANA_CONFIG = {
    network: process.env.SOLANA_NETWORK || 'devnet',
    endpoints: {
        mainnet: process.env.SOLANA_MAINNET_URL || 'https://api.mainnet-beta.solana.com',
        devnet: process.env.SOLANA_DEVNET_URL || 'https://api.devnet.solana.com',
        testnet: process.env.SOLANA_TESTNET_URL || 'https://api.testnet.solana.com',
        local: 'http://localhost:8899'
    },
    // Obtenir l'endpoint en fonction du réseau configuré
    get endpoint() {
        return this.endpoints[this.network] || this.endpoints.devnet;
    }
};
// Configuration Magic.link
exports.MAGIC_CONFIG = {
    publishableKey: process.env.MAGIC_PUBLISHABLE_KEY || '',
    secretKey: process.env.MAGIC_SECRET_KEY || ''
};
// Configuration de l'admin wallet pour payer les frais (account abstraction)
const getAdminKeypair = () => {
    const privateKeyBase58 = process.env.ADMIN_PRIVATE_KEY;
    if (!privateKeyBase58) {
        throw new Error("ERREUR: Clé privée d'admin non définie. Définissez ADMIN_PRIVATE_KEY dans .env");
    }
    try {
        const secretKey = bs58_1.default.decode(privateKeyBase58);
        return web3_js_1.Keypair.fromSecretKey(secretKey);
    }
    catch (error) {
        throw new Error(`ERREUR: Format de clé privée invalide: ${error.message}`);
    }
};
exports.getAdminKeypair = getAdminKeypair;
// Vérifier la configuration au démarrage
const validateConfig = () => {
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
exports.validateConfig = validateConfig;
