import { Magic, MagicUserMetadata } from '@magic-sdk/admin';
import { v4 as uuidv4 } from 'uuid';
import { UserAccount } from '../interfaces/types';
import { MAGIC_CONFIG } from '../config';
import { Keypair } from '@solana/web3.js';

/**
 * Service pour gérer l'authentification via Magic.link
 */
export class MagicAuthService {
  private magic: Magic;
  
  constructor() {
    if (!MAGIC_CONFIG.secretKey) {
      throw new Error("La clé secrète Magic n'est pas configurée dans les variables d'environnement");
    }
    
    this.magic = new Magic(MAGIC_CONFIG.secretKey);
    console.log("Service d'authentification Magic initialisé");
  }
  
  /**
   * Valider un DID token Magic
   */
  async validateToken(didToken: string): Promise<boolean> {
    try {
      this.magic.token.validate(didToken);
      return true;
    } catch (error) {
      console.error("Token Magic invalide:", error);
      return false;
    }
  }
  
  /**
   * Récupérer les métadonnées utilisateur à partir d'un token
   */
  async getUserMetadata(didToken: string): Promise<{
    issuer: string;
    email?: string;
    publicAddress?: string;
  }> {
    try {
      const metadata = await this.magic.users.getMetadataByToken(didToken);
      
      // Vérifier que l'issuer existe et le transformer en string non-null
      if (!metadata.issuer) {
        throw new Error("Issuer manquant dans les métadonnées Magic");
      }
      
      // Retourner un objet propre avec les types corrects
      return {
        issuer: metadata.issuer,
        email: metadata.email || undefined,
        publicAddress: metadata.publicAddress || undefined
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des métadonnées:", error);
      throw error;
    }
  }
  
  /**
   * Vérifier si une chaîne est au format base58 valide
   * Le format base58 utilise ces caractères: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
   */
  private isValidBase58(str: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]+$/.test(str);
  }
  
  /**
   * Générer une adresse Solana valide au format base58
   */
  private generateValidSolanaAddress(): string {
    const keypair = Keypair.generate();
    return keypair.publicKey.toString();
  }
  
  /**
   * Créer un compte utilisateur à partir des données Magic
   */
  async createUserAccountFromMagic(
    didToken: string, 
    username?: string
  ): Promise<UserAccount> {
    try {
      // Valider le token
      const isValid = await this.validateToken(didToken);
      if (!isValid) {
        throw new Error("Token Magic invalide");
      }
      
      // Récupérer les métadonnées
      const metadata = await this.getUserMetadata(didToken);
      
      // Gérer le cas où l'adresse publique est manquante ou invalide
      let publicKey: string;
      
      if (!metadata.publicAddress) {
        console.warn("Adresse publique manquante dans les métadonnées Magic, génération d'une nouvelle adresse");
        publicKey = this.generateValidSolanaAddress();
      } else if (!this.isValidBase58(metadata.publicAddress)) {
        console.warn("Adresse publique invalide (non-base58) dans les métadonnées Magic, génération d'une nouvelle adresse");
        publicKey = this.generateValidSolanaAddress();
      } else {
        publicKey = metadata.publicAddress;
      }
      
      // Générer un nom d'utilisateur par défaut si aucun n'est fourni
      const defaultUsername = username || 
        metadata.email?.split('@')[0] || 
        `user_${publicKey.slice(0, 6)}`;
      
      // Créer l'objet utilisateur
      const userAccount: UserAccount = {
        id: `user_${uuidv4()}`,
        username: defaultUsername,
        publicKey: publicKey, // Adresse Solana valide garantie
        magicIssuer: metadata.issuer,
        email: metadata.email,
        createdAt: Date.now()
      };
      
      return userAccount;
    } catch (error) {
      console.error("Erreur lors de la création du compte utilisateur:", error);
      throw error;
    }
  }
  
  /**
   * Déconnecter un utilisateur Magic
   */
  async logoutUser(issuer: string): Promise<boolean> {
    try {
      await this.magic.users.logoutByIssuer(issuer);
      return true;
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      return false;
    }
  }
  
  /**
   * Vérifier si un utilisateur existe déjà avec cet issuer
   */
  async userExists(issuer: string): Promise<boolean> {
    try {
      const metadata = await this.magic.users.getMetadataByIssuer(issuer);
      return !!metadata;
    } catch (error) {
      return false;
    }
  }
}