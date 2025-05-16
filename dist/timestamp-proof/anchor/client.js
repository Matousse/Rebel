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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimestampProofClient = void 0;
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
const idl_1 = require("./idl");
const config_1 = require("../../account-abstraction/config");
// Adresse du programme après déploiement
const PROGRAM_ID = new web3_js_1.PublicKey('8Hh439HNMKGRTD1gmnifrJ2RrP6y8PsKwHRRQyponubt');
/**
 * Client pour interagir avec le programme Anchor timestamp_proof
 */
class TimestampProofClient {
    /**
     * Initialise le client avec un keypair pour payer les transactions
     * @param payerKeypair Keypair pour payer les frais de transaction
     */
    constructor(payerKeypair) {
        // Créer la connexion Solana
        this.connection = new web3_js_1.Connection(config_1.SOLANA_CONFIG.endpoint, 'confirmed');
        // Créer le wallet pour Anchor
        const wallet = new anchor.Wallet(payerKeypair);
        // Créer le provider Anchor
        this.provider = new anchor.AnchorProvider(this.connection, wallet, { commitment: 'confirmed', preflightCommitment: 'confirmed' });
        // Use anchor.workspace approach which handles IDL types better
        // This needs proper type casting for TypeScript to understand the structure
        this.program = new anchor.Program(idl_1.IDL, PROGRAM_ID, this.provider);
        console.log('TimestampProofClient initialisé sur', config_1.SOLANA_CONFIG.network);
    }
    /**
     * Dérive l'adresse PDA pour une preuve de création
     * @param artistPublicKey Clé publique de l'artiste
     * @param trackHash Hash du track en bytes
     * @returns Adresse PDA et bump
     */
    async deriveProofPDA(artistPublicKey, trackHash) {
        return await web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('proof-of-creation'),
            artistPublicKey.toBuffer(),
            Buffer.from(trackHash)
        ], PROGRAM_ID);
    }
    /**
     * Crée une nouvelle preuve de création
     * @param artistKeypair Keypair de l'artiste (pour signer)
     * @param trackHash Hash du fichier audio en Uint8Array
     * @returns Signature de la transaction
     */
    async mintProofOfCreation(artistKeypair, trackHash) {
        try {
            // Dériver l'adresse PDA
            const [proofPDA, _] = await this.deriveProofPDA(artistKeypair.publicKey, trackHash);
            // Créer et envoyer la transaction
            const tx = await this.program.methods
                .mintProofOfCreation(Array.from(trackHash))
                .accounts({
                artist: artistKeypair.publicKey,
                payer: this.provider.wallet.publicKey, // Le wallet du client paie
                proofOfCreation: proofPDA,
                systemProgram: anchor.web3.SystemProgram.programId
            })
                .signers([artistKeypair]) // L'artiste doit signer
                .rpc();
            console.log(`Preuve de création créée: ${tx}`);
            return tx;
        }
        catch (error) {
            console.error('Erreur lors de la création de la preuve:', error);
            throw error;
        }
    }
    /**
     * Récupère les informations d'une preuve de création
     * @param artistPublicKey Clé publique de l'artiste
     * @param trackHash Hash du fichier audio en Uint8Array
     * @returns Données de la preuve de création ou null si non trouvée
     */
    async getProofOfCreation(artistPublicKey, trackHash) {
        try {
            // Dériver l'adresse PDA
            const [proofPDA, _] = await this.deriveProofPDA(artistPublicKey, trackHash);
            // First check if account exists
            const accountInfo = await this.connection.getAccountInfo(proofPDA);
            if (!accountInfo) {
                return null;
            }
            // Use direct coder approach to avoid TypeScript issues
            const coder = new anchor.BorshAccountsCoder(idl_1.IDL);
            try {
                const decoded = coder.decode('ProofOfCreation', // The account name from your IDL
                accountInfo.data);
                return {
                    artist: decoded.artist.toString(),
                    trackHash: new Uint8Array(decoded.trackHash),
                    timestamp: decoded.timestamp.toNumber(),
                    pdaAddress: proofPDA.toString()
                };
            }
            catch (decodeError) {
                console.error('Failed to decode account:', decodeError);
                return null;
            }
        }
        catch (error) {
            // Si le compte n'existe pas, renvoyer null
            console.log('Preuve non trouvée ou erreur:', error);
            return null;
        }
    }
    /**
     * Vérifie si une preuve de création existe
     * @param artistPublicKey Clé publique de l'artiste
     * @param trackHash Hash du fichier audio
     * @returns true si la preuve existe, false sinon
     */
    async proofExists(artistPublicKey, trackHash) {
        try {
            const proof = await this.getProofOfCreation(artistPublicKey, trackHash);
            return proof !== null;
        }
        catch (error) {
            return false;
        }
    }
}
exports.TimestampProofClient = TimestampProofClient;
